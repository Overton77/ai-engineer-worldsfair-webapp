import { put, type PutBlobResult } from "@vercel/blob";

export const LEARNING_IMAGE_BLOB_PREFIX = "learning";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
type PublicBlobBody = Parameters<typeof put>[1];

type PublicBlobUploadInput = {
  pathname: string;
  body: PublicBlobBody;
  contentType: string;
  allowOverwrite?: boolean;
  cacheControlMaxAge?: number;
  token?: string;
};

export async function uploadPublicBlob({
  pathname,
  body,
  contentType,
  allowOverwrite = false,
  cacheControlMaxAge = ONE_YEAR_SECONDS,
  token = process.env.BLOB_READ_WRITE_TOKEN,
}: PublicBlobUploadInput): Promise<PutBlobResult> {
  if (!token) {
    throw new Error(
      "Missing BLOB_READ_WRITE_TOKEN. Create/link a Vercel Blob store and pull env vars before uploading.",
    );
  }

  return put(pathname, body, {
    access: "public",
    contentType,
    allowOverwrite,
    cacheControlMaxAge,
    token,
  });
}
