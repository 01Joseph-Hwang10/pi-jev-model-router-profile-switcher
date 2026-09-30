export type Tier = "quick" | "standard" | "high" | "premium" | "xpremium";

export const ROUTE_TIERS: readonly Tier[] = [
  "quick",
  "standard",
  "high",
  "premium",
  "xpremium",
] as const;

export type ThinkingLevel =
  | "off"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

export interface RouteTarget {
  provider: string;
  model: string;
  thinkingLevel?: ThinkingLevel;
  minTier?: Tier;
  priority?: number;
}

export type RouteChain = RouteTarget[];

export interface FreePoolConfig {
  enabled: boolean;
  policy: "prefer" | "fallback-only";
  pool: RouteChain;
}

export interface BudgetConfig {
  dailyUsd?: number;
  monthlyUsd?: number;
  softRatio?: number;
  hardRatio?: number;
}

export interface CacheConfig {
  aware?: boolean;
  deadband?: number;
  maxPenaltyUsd?: number;
  bypassTierDelta?: number;
}

export interface JevProfile {
  name?: string;
  description?: string;
  useDefaultModels?: boolean;
  enabled?: boolean;
  mode?: "auto" | "confirm" | "notify";
  apiKeyEnv?: string;
  apiKey?: string;
  endpointEnv?: string;
  endpoint?: string;
  jevModel?: string;
  timeoutMs?: number;
  minPromptChars?: number;
  historyTurns?: number;
  confidenceThreshold?: number;
  stickiness?: boolean;
  stateFile?: string;
  routes?: Partial<Record<Tier, RouteChain>>;
  kindModels?: Record<string, RouteChain>;
  kindMinimumTier?: Record<string, Tier>;
  free?: FreePoolConfig;
  budget?: BudgetConfig;
  cache?: CacheConfig;
  taskKinds?: Record<string, string>;
  /**
   * Optional mapping of provider names to recommended account IDs in pi-account-switcher.
   * Example: { "google": "google-personal", "openai": "openai-work" }
   */
  recommendedAccounts?: Record<string, string>;
  [key: string]: unknown;
}

export type ProfilesCollection = Record<string, JevProfile>;

export interface ProfileSwitcherState {
  activeProfile?: string;
  lastSwitchedAt?: string;
}

export interface ProfileSummary {
  name: string;
  isActive: boolean;
  description?: string;
  useDefaultModels: boolean;
  providers: string[];
  routesSummary: Partial<Record<Tier, string>>;
  kindModelCount: number;
}

export interface SwitchResult {
  previousProfileName?: string;
  currentProfileName: string;
  routerConfigurationPath: string;
  providers: string[];
  reloaded: boolean;
}
