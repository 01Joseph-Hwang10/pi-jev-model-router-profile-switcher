import type {
  JevProfile,
  ProfileSummary,
  RouteChain,
  RouteTarget,
  Tier,
} from "../domain/types.js";
import { ROUTE_TIERS } from "../domain/types.js";
import type { ProviderAccountStatus } from "../storage/account-switcher.js";

export function extractProvidersFromProfile(profile: JevProfile): string[] {
  const providerSet = new Set<string>();

  if (profile.routes) {
    for (const chain of Object.values(profile.routes)) {
      if (Array.isArray(chain)) {
        for (const target of chain) {
          if (target && typeof target.provider === "string" && target.provider.trim()) {
            providerSet.add(target.provider.trim());
          }
        }
      }
    }
  }

  if (profile.kindModels) {
    for (const chain of Object.values(profile.kindModels)) {
      if (Array.isArray(chain)) {
        for (const target of chain) {
          if (target && typeof target.provider === "string" && target.provider.trim()) {
            providerSet.add(target.provider.trim());
          }
        }
      }
    }
  }

  if (profile.free?.pool && Array.isArray(profile.free.pool)) {
    for (const target of profile.free.pool) {
      if (target && typeof target.provider === "string" && target.provider.trim()) {
        providerSet.add(target.provider.trim());
      }
    }
  }

  return Array.from(providerSet);
}

export function summarizeProfileRoutes(
  profile: JevProfile,
): Partial<Record<Tier, string>> {
  const summary: Partial<Record<Tier, string>> = {};

  if (!profile.routes) {
    return summary;
  }

  for (const tier of ROUTE_TIERS) {
    const chain = profile.routes[tier];
    if (chain && chain.length > 0) {
      const firstTarget = chain[0];
      const modelIdentifier = `${firstTarget.provider}/${firstTarget.model}`;
      const additionalCount = chain.length - 1;
      summary[tier] =
        additionalCount > 0
          ? `${modelIdentifier} (+${additionalCount} fallback${additionalCount > 1 ? "s" : ""})`
          : modelIdentifier;
    }
  }

  return summary;
}

export function getProfileSummary(
  profileName: string,
  profile: JevProfile,
  isActive: boolean,
): ProfileSummary {
  const providers = extractProvidersFromProfile(profile);
  const routesSummary = summarizeProfileRoutes(profile);
  const kindModelCount = profile.kindModels ? Object.keys(profile.kindModels).length : 0;

  return {
    name: profileName,
    isActive,
    description: profile.description,
    useDefaultModels: profile.useDefaultModels ?? true,
    providers,
    routesSummary,
    kindModelCount,
  };
}

export function formatProfileListItem(
  profileName: string,
  profile: JevProfile,
  isActive: boolean,
): string {
  const marker = isActive ? "● [ACTIVE]" : "○";
  const providers = extractProvidersFromProfile(profile);
  const providerLabel =
    providers.length > 0 ? `[${providers.join(", ")}]` : "[no providers]";
  const descriptionPart = profile.description ? ` — ${profile.description}` : "";

  return `${marker} ${profileName} ${providerLabel}${descriptionPart}`;
}

export function formatProfileDetailView(
  profileName: string,
  profile: JevProfile,
  isActive: boolean,
  accountStatuses?: Record<string, ProviderAccountStatus>,
): string {
  const lines: string[] = [];

  const statusLabel = isActive ? "ACTIVE" : "INACTIVE";
  lines.push(`Profile: ${profileName} [${statusLabel}]`);
  if (profile.description) {
    lines.push(`Description: ${profile.description}`);
  }
  lines.push(
    `Built-in models fallback: ${profile.useDefaultModels === false ? "Off (pure config)" : "On"}`,
  );
  if (profile.mode) {
    lines.push(`Router Mode: ${profile.mode}`);
  }

  const providers = extractProvidersFromProfile(profile);
  lines.push(`Providers used: ${providers.length > 0 ? providers.join(", ") : "none"}`);

  if (accountStatuses && Object.keys(accountStatuses).length > 0) {
    lines.push("\nAccount Switcher Status:");
    for (const [provider, status] of Object.entries(accountStatuses)) {
      if (status.configuredAccounts.length === 0) {
        lines.push(`  ${provider}: No accounts configured in pi-account-switcher`);
      } else {
        const activeLabel = status.activeAccountLabel
          ? `✓ Active: ${status.activeAccountLabel}`
          : "⚠️ None active";
        lines.push(
          `  ${provider}: ${status.configuredAccounts.length} account(s) available (${activeLabel})`,
        );
      }
    }
  }

  lines.push("\nTier Routes:");
  if (profile.routes) {
    for (const tier of ROUTE_TIERS) {
      const chain = profile.routes[tier];
      if (chain && chain.length > 0) {
        lines.push(`  ${tier.padEnd(9)}: ${formatRouteChain(chain)}`);
      } else {
        lines.push(`  ${tier.padEnd(9)}: (empty)`);
      }
    }
  } else {
    lines.push("  (no explicit tier routes configured)");
  }

  if (profile.kindModels && Object.keys(profile.kindModels).length > 0) {
    lines.push(`\nKind Specialists (${Object.keys(profile.kindModels).length}):`);
    for (const [kind, chain] of Object.entries(profile.kindModels)) {
      lines.push(`  ${kind.padEnd(10)}: ${formatRouteChain(chain)}`);
    }
  }

  if (profile.free?.enabled && profile.free.pool.length > 0) {
    lines.push(`\nFree Pool (${profile.free.policy}):`);
    lines.push(`  ${formatRouteChain(profile.free.pool)}`);
  }

  if (profile.budget) {
    const budgetParts: string[] = [];
    if (typeof profile.budget.dailyUsd === "number") {
      budgetParts.push(`daily: $${profile.budget.dailyUsd}`);
    }
    if (typeof profile.budget.monthlyUsd === "number") {
      budgetParts.push(`monthly: $${profile.budget.monthlyUsd}`);
    }
    if (budgetParts.length > 0) {
      lines.push(`\nBudget: ${budgetParts.join(", ")}`);
    }
  }

  return lines.join("\n");
}

function formatRouteChain(chain: RouteChain): string {
  return chain
    .map((target: RouteTarget) => {
      const thinkingPart = target.thinkingLevel ? ` [thinking: ${target.thinkingLevel}]` : "";
      const minTierPart = target.minTier ? ` (minTier: ${target.minTier})` : "";
      return `${target.provider}/${target.model}${thinkingPart}${minTierPart}`;
    })
    .join(" → ");
}
