/**
 * Mirror of the `person.role_bucket` derived enum from
 * `supabase/migrations/20260424120100_person_role_bucket.sql`.
 *
 * Keep this list in sync with the SQL CASE expression. The bucket is a
 * generated column, so changing the SQL automatically reclassifies all
 * rows — which means this constant is the *only* thing the UI needs to
 * agree on (we don't enumerate values from runtime data).
 */

export const ROLE_BUCKETS = [
  "founder_csuite",
  "engineer",
  "devrel_community",
  "researcher",
  "product",
  "solutions",
  "design",
  "investor",
  "business_gtm",
  "other",
] as const;

export type RoleBucket = (typeof ROLE_BUCKETS)[number];

export const ROLE_BUCKET_LABELS: Record<RoleBucket, string> = {
  founder_csuite: "Founder / C-suite",
  engineer: "Engineer / Tech Lead",
  devrel_community: "DevRel / Community",
  researcher: "Researcher / Scientist",
  product: "Product",
  solutions: "Solutions / SA",
  design: "Design",
  investor: "Investor / VC",
  business_gtm: "Business / GTM",
  other: "Other",
};

const ROLE_BUCKET_SET = new Set<string>(ROLE_BUCKETS);

export function isRoleBucket(value: string): value is RoleBucket {
  return ROLE_BUCKET_SET.has(value);
}

export function sanitizeRoleBuckets(input: readonly string[] | undefined): RoleBucket[] {
  if (!input || input.length === 0) return [];
  return Array.from(new Set(input.filter(isRoleBucket)));
}
