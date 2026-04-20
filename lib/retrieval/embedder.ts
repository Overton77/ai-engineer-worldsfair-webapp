/**
 * Embedding adapter — single source of truth for vector generation.
 *
 * Uses Amazon Bedrock + Cohere `cohere.embed-v4:0` at 1536 dims to match every
 * `vector(1536)` column in the schema (chunk, organization, person, library,
 * product, paper, youtube_video, session, event, news_item, report,
 * course_module).
 *
 * Auth: AWS Bedrock API key via the `AWS_BEARER_TOKEN_BEDROCK` environment
 * variable, sent as `Authorization: Bearer <key>` to the Bedrock Runtime REST
 * endpoint. No SigV4, no @aws-sdk dependency.
 *
 * Two export shapes:
 *   - `embedQuery(text)`               — single query (input_type=search_query)
 *   - `embedDocuments(texts, options)` — batch up to 96 (input_type=search_document)
 *
 * `lib/retrieval/search.ts` calls `embedQuery`. Ingestion scripts call
 * `embedDocuments`. Swapping providers later is one file: keep both signatures,
 * change the body.
 */

export const RETRIEVAL_EMBEDDING_DIMS = 1536 as const;

const DEFAULT_MODEL_ID = "cohere.embed-v4:0";
const DEFAULT_REGION = "us-east-1";
const COHERE_MAX_BATCH = 96;

type CohereInputType =
  | "search_document"
  | "search_query"
  | "classification"
  | "clustering";

interface CohereEmbedRequest {
  texts: string[];
  input_type: CohereInputType;
  output_dimension?: 256 | 512 | 1024 | 1536;
  truncate?: "NONE" | "START" | "END";
}

interface CohereEmbedResponseFloat {
  id: string;
  response_type: "embeddings_floats";
  embeddings: number[][];
  texts?: string[];
}

interface CohereEmbedResponseByType {
  id: string;
  response_type: "embeddings_by_type";
  embeddings: { float?: number[][] };
  texts?: string[];
}

type CohereEmbedResponse = CohereEmbedResponseFloat | CohereEmbedResponseByType;

function bedrockEndpoint(modelId: string, region: string): string {
  return `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(
    modelId,
  )}/invoke`;
}

function getEnv(): { token: string; region: string; modelId: string } {
  const token = process.env.AWS_BEARER_TOKEN_BEDROCK;
  if (!token) {
    throw new Error(
      "AWS_BEARER_TOKEN_BEDROCK is not set. Add it to aiengineerapp/.env (or export it). Generate one in the AWS Bedrock console under 'API keys'.",
    );
  }
  const region = process.env.AWS_REGION || DEFAULT_REGION;
  const modelId = process.env.EMBEDDING_MODEL_COHERE || DEFAULT_MODEL_ID;
  return { token, region, modelId };
}

async function callCohereEmbed(
  texts: string[],
  inputType: CohereInputType,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > COHERE_MAX_BATCH) {
    throw new Error(
      `callCohereEmbed: batch of ${texts.length} exceeds Cohere v4 max of ${COHERE_MAX_BATCH}; pre-chunk in the caller`,
    );
  }
  for (const t of texts) {
    if (typeof t !== "string" || t.trim().length === 0) {
      throw new Error("callCohereEmbed: every input must be a non-empty string");
    }
  }

  const { token, region, modelId } = getEnv();

  const body: CohereEmbedRequest = {
    texts,
    input_type: inputType,
    output_dimension: RETRIEVAL_EMBEDDING_DIMS,
    truncate: "END",
  };

  const res = await fetch(bedrockEndpoint(modelId, region), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    throw new Error(
      `Bedrock Cohere embed failed (${res.status} ${res.statusText}): ${text.slice(0, 500)}`,
    );
  }

  const data = (await res.json()) as CohereEmbedResponse;

  let vectors: number[][] | undefined;
  if (data.response_type === "embeddings_floats") {
    vectors = data.embeddings;
  } else if (data.response_type === "embeddings_by_type") {
    vectors = data.embeddings.float;
  }

  if (!vectors || vectors.length !== texts.length) {
    throw new Error(
      `Bedrock Cohere embed: expected ${texts.length} vectors, got ${vectors?.length ?? 0}`,
    );
  }
  for (let i = 0; i < vectors.length; i++) {
    if (vectors[i].length !== RETRIEVAL_EMBEDDING_DIMS) {
      throw new Error(
        `Bedrock Cohere embed: vector[${i}] has ${vectors[i].length} dims, expected ${RETRIEVAL_EMBEDDING_DIMS}`,
      );
    }
  }
  return vectors;
}

export async function embedQuery(input: string): Promise<number[]> {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("embedQuery: input must be a non-empty string");
  }
  const [vec] = await callCohereEmbed([input], "search_query");
  return vec;
}

export interface EmbedDocumentsOptions {
  /** Max batch passed to Cohere (capped at 96). Defaults to 96. */
  batchSize?: number;
  /**
   * Optional progress callback fired after each batch completes.
   * `done` is the running count of successfully embedded inputs.
   */
  onBatch?: (done: number, total: number) => void;
}

export async function embedDocuments(
  inputs: string[],
  options: EmbedDocumentsOptions = {},
): Promise<number[][]> {
  if (inputs.length === 0) return [];

  const batchSize = Math.min(
    Math.max(1, options.batchSize ?? COHERE_MAX_BATCH),
    COHERE_MAX_BATCH,
  );

  const out: number[][] = new Array(inputs.length);
  let done = 0;
  for (let start = 0; start < inputs.length; start += batchSize) {
    const slice = inputs.slice(start, start + batchSize);
    const vecs = await callCohereEmbed(slice, "search_document");
    for (let i = 0; i < vecs.length; i++) out[start + i] = vecs[i];
    done += vecs.length;
    options.onBatch?.(done, inputs.length);
  }
  return out;
}
