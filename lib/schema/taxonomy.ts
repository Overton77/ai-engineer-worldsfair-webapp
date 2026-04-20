import { z } from "zod";

/**
 * Single source of truth for the 26-category video taxonomy and the
 * 5-layer curriculum meta-stack. Mirrors `aiwiki/docs/03-taxonomy.md`.
 *
 * Resolves Q15: `profiles.interest_tags` and `profiles.expertise_tags`
 * are constrained at the Server-Action layer to elements of these
 * unions. Onboarding chip pickers and settings tag editors source
 * their options from here.
 *
 * Stays in sync with:
 *  - `aiengineerapp/scripts/backfill-video-categories.ts` (CATEGORY_TO_LAYER)
 *  - `youtube_video.category` / `youtube_video.domain_layer` columns
 *  - chunk metadata (`category`, `domain_layer` in jsonb)
 */

export const CATEGORY_KEYS = [
  // L1 — Intelligence
  "foundation_models",
  "research_capabilities",
  "rl_post_training",
  "vision_multimodal",
  "voice_audio",
  "local_llms",
  "rag_knowledge",
  // L2 — Agents
  "agent_orchestration",
  "prompt_context_engineering",
  "dev_tooling",
  "mcp_a2a",
  // L3 — Systems
  "ai_infra_observability",
  "web_browser_ai",
  // L4 — Application
  "coding_agents",
  "product_ux",
  "vertical_ai",
  "personal_ai",
  "recsys_search",
  "data_engineering",
  "generative_media",
  "robotics",
  // L5 — Governance
  "evaluations",
  "security_governance",
  "founders_business",
  "engineering_culture",
  "keynote_compilation",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CategoryKeySchema = z.enum(CATEGORY_KEYS);

/**
 * Human-readable labels for the 26 categories. Used by chip pickers and
 * any UI that needs to render a category name (search facets, dossier
 * tags, etc.).
 */
export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  foundation_models: "Foundation models",
  research_capabilities: "Research & capabilities",
  rl_post_training: "RL & post-training",
  vision_multimodal: "Vision & multimodal",
  voice_audio: "Voice & audio",
  local_llms: "Local & on-device LLMs",
  rag_knowledge: "RAG & knowledge",
  agent_orchestration: "Agent orchestration",
  prompt_context_engineering: "Prompt & context engineering",
  dev_tooling: "Dev tooling",
  mcp_a2a: "MCP & A2A protocols",
  ai_infra_observability: "AI infra & observability",
  web_browser_ai: "Web & browser AI",
  coding_agents: "Coding agents & IDEs",
  product_ux: "Product & UX",
  vertical_ai: "Vertical AI",
  personal_ai: "Personal AI",
  recsys_search: "Recs & search",
  data_engineering: "Data engineering",
  generative_media: "Generative media",
  robotics: "Robotics",
  evaluations: "Evaluations & LLM-as-judge",
  security_governance: "Security & governance",
  founders_business: "Founders & business",
  engineering_culture: "Engineering culture",
  keynote_compilation: "Keynotes",
};

/**
 * The 5-layer meta-stack used at the curriculum level. Stored snake_case
 * in `youtube_video.domain_layer` and `profiles.home_layer`; the UI
 * Title-Cases them. Order matches L1 → L5.
 */
export const DOMAIN_LAYERS = [
  "intelligence",
  "agents",
  "systems",
  "application",
  "governance",
] as const;

export type DomainLayer = (typeof DOMAIN_LAYERS)[number];

export const DomainLayerSchema = z.enum(DOMAIN_LAYERS);

export const DOMAIN_LAYER_META: Record<
  DomainLayer,
  { code: string; label: string; tagline: string }
> = {
  intelligence: {
    code: "L1",
    label: "Intelligence",
    tagline:
      "Foundations, RL, multimodal models, and the knowledge systems that power them.",
  },
  agents: {
    code: "L2",
    label: "Agents",
    tagline:
      "Agent architectures, context engineering, and the programming paradigms behind them.",
  },
  systems: {
    code: "L3",
    label: "Systems",
    tagline:
      "Infrastructure, durable execution, observability, and developer environments.",
  },
  application: {
    code: "L4",
    label: "Application",
    tagline:
      "Coding agents, AI products, vertical applications, and enterprise systems.",
  },
  governance: {
    code: "L5",
    label: "Governance",
    tagline:
      "Evaluation, security, economics, and the engineering culture that ships it.",
  },
};

/**
 * Primary category → layer mapping. Mirrors the table in
 * `aiwiki/docs/03-taxonomy.md` and the same map in
 * `aiengineerapp/scripts/backfill-video-categories.ts`. The mapping is
 * primary; multi-layer membership (a category can touch multiple layers)
 * lives at the chunk-metadata level.
 */
export const CATEGORY_TO_LAYER: Record<CategoryKey, DomainLayer> = {
  foundation_models: "intelligence",
  research_capabilities: "intelligence",
  rl_post_training: "intelligence",
  vision_multimodal: "intelligence",
  voice_audio: "intelligence",
  local_llms: "intelligence",
  rag_knowledge: "intelligence",

  agent_orchestration: "agents",
  prompt_context_engineering: "agents",
  dev_tooling: "agents",
  mcp_a2a: "agents",

  ai_infra_observability: "systems",
  web_browser_ai: "systems",

  coding_agents: "application",
  product_ux: "application",
  vertical_ai: "application",
  personal_ai: "application",
  recsys_search: "application",
  data_engineering: "application",
  generative_media: "application",
  robotics: "application",

  evaluations: "governance",
  security_governance: "governance",
  founders_business: "governance",
  engineering_culture: "governance",
  keynote_compilation: "governance",
};

/**
 * Curated "show first" list for the onboarding interest picker. Picks
 * the most populous categories from the corpus so a brand-new user sees
 * options that have rich content behind them on day one.
 */
export const POPULAR_CATEGORIES: readonly CategoryKey[] = [
  "coding_agents",
  "agent_orchestration",
  "evaluations",
  "rag_knowledge",
  "ai_infra_observability",
  "mcp_a2a",
  "rl_post_training",
  "foundation_models",
];

/**
 * Goals the onboarding wizard offers (Step 4 of the wizard). Stored as
 * `profiles.goals[]`. Free text is rejected at the Server-Action layer.
 */
export const GOAL_KEYS = [
  "build_side_project",
  "switch_into_ai",
  "stay_current",
  "teach_others",
  "ship_at_work",
  "get_hired",
] as const;

export type GoalKey = (typeof GOAL_KEYS)[number];

export const GoalKeySchema = z.enum(GOAL_KEYS);

export const GOAL_LABELS: Record<GoalKey, string> = {
  build_side_project: "Build a side project",
  switch_into_ai: "Switch into AI engineering",
  stay_current: "Stay current with the field",
  teach_others: "Teach others what I learn",
  ship_at_work: "Ship AI at work",
  get_hired: "Get hired",
};

/**
 * Experience-level enum mirrors `profiles_experience_level_check` in
 * `supabase/migrations/20260418120400_expand_profiles_and_follow_graph.sql`.
 */
export const EXPERIENCE_LEVELS = [
  "junior",
  "mid",
  "senior",
  "staff",
  "principal",
  "founder",
  "exec",
  "student",
  "researcher",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const ExperienceLevelSchema = z.enum(EXPERIENCE_LEVELS);

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  junior: "Junior engineer",
  mid: "Mid-level engineer",
  senior: "Senior engineer",
  staff: "Staff engineer",
  principal: "Principal engineer",
  founder: "Founder",
  exec: "Exec / leadership",
  student: "Student",
  researcher: "Researcher",
};

/**
 * Onboarding-status state machine. Mirrors
 * `profiles_onboarding_status_check`. The wizard uses these values to
 * resume mid-flow.
 */
export const ONBOARDING_STATUSES = [
  "pending",
  "in_progress",
  "complete",
  "skipped",
] as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const OnboardingStatusSchema = z.enum(ONBOARDING_STATUSES);
