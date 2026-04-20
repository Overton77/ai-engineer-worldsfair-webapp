import { CATEGORY_KEYS, type CategoryKey } from "@/lib/schema/taxonomy";

/**
 * Free-text → canonical category map (Q15). The recommender and the
 * one-shot `scripts/normalize-profile-tags.ts` pass use this to fold
 * legacy free-text tags into the controlled vocabulary.
 *
 * Lower-case keys; lookup is case-insensitive.
 */
const RAW_SYNONYMS: Record<string, CategoryKey> = {
  // agents
  agentic: "agent_orchestration",
  agents: "agent_orchestration",
  "ai-agents": "agent_orchestration",
  "ai agents": "agent_orchestration",
  "multi-agent": "agent_orchestration",
  multiagent: "agent_orchestration",
  orchestration: "agent_orchestration",

  // evals
  evals: "evaluations",
  eval: "evaluations",
  "llm-as-judge": "evaluations",
  "llm-judge": "evaluations",
  judge: "evaluations",

  // RAG
  rag: "rag_knowledge",
  retrieval: "rag_knowledge",
  "knowledge-graph": "rag_knowledge",
  knowledge: "rag_knowledge",
  embeddings: "rag_knowledge",

  // foundation models
  llm: "foundation_models",
  llms: "foundation_models",
  "foundation-models": "foundation_models",

  // RL
  rl: "rl_post_training",
  rlhf: "rl_post_training",
  finetune: "rl_post_training",
  "fine-tuning": "rl_post_training",

  // multimodal
  vision: "vision_multimodal",
  multimodal: "vision_multimodal",
  vlm: "vision_multimodal",

  // voice
  voice: "voice_audio",
  audio: "voice_audio",
  speech: "voice_audio",
  asr: "voice_audio",
  tts: "voice_audio",

  // local llms
  local: "local_llms",
  ollama: "local_llms",
  "on-device": "local_llms",

  // coding agents
  copilot: "coding_agents",
  cursor: "coding_agents",
  ide: "coding_agents",
  swe: "coding_agents",
  "code-agent": "coding_agents",

  // MCP
  mcp: "mcp_a2a",
  "model-context-protocol": "mcp_a2a",
  a2a: "mcp_a2a",

  // dev tooling
  pydantic: "dev_tooling",
  "structured-output": "dev_tooling",
  typechat: "dev_tooling",

  // prompt eng
  prompts: "prompt_context_engineering",
  prompting: "prompt_context_engineering",
  "context-engineering": "prompt_context_engineering",

  // infra
  infra: "ai_infra_observability",
  observability: "ai_infra_observability",
  "ml-infra": "ai_infra_observability",

  // browser
  browser: "web_browser_ai",
  "web-ai": "web_browser_ai",

  // product
  ux: "product_ux",
  product: "product_ux",
  design: "product_ux",

  // data eng
  "data-engineering": "data_engineering",
  etl: "data_engineering",
  pipelines: "data_engineering",

  // generative media
  "image-generation": "generative_media",
  "video-generation": "generative_media",
  diffusion: "generative_media",

  // robotics
  embodied: "robotics",

  // recsys
  recsys: "recsys_search",
  recommendations: "recsys_search",
  search: "recsys_search",

  // security / governance
  security: "security_governance",
  governance: "security_governance",
  safety: "security_governance",
  "red-team": "security_governance",

  // founders
  founders: "founders_business",
  business: "founders_business",
  gtm: "founders_business",

  // engineering culture
  culture: "engineering_culture",
  craft: "engineering_culture",
};

const CANONICAL = new Set<string>(CATEGORY_KEYS);

/**
 * Returns the canonical CategoryKey for a free-text tag, or `null` if
 * the tag has no known mapping. Already-canonical inputs pass through.
 */
export function canonicalizeTag(input: string): CategoryKey | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  if (CANONICAL.has(trimmed)) return trimmed as CategoryKey;
  return RAW_SYNONYMS[trimmed] ?? null;
}

/**
 * Canonicalize an array of tags. Drops anything that doesn't map and
 * deduplicates the result preserving first-seen order.
 */
export function canonicalizeTags(input: readonly string[]): CategoryKey[] {
  const seen = new Set<CategoryKey>();
  const out: CategoryKey[] = [];
  for (const raw of input) {
    const canonical = canonicalizeTag(raw);
    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      out.push(canonical);
    }
  }
  return out;
}
