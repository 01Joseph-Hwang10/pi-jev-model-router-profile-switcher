import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { JevProfile, ProfilesCollection } from "../domain/types.js";
import { formatError, isMissingFileError } from "../shared/errors.js";
import { getGlobalRouterConfigPath } from "./paths.js";

export async function loadActiveRouterConfig(
  configurationPath: string = getGlobalRouterConfigPath(),
): Promise<Record<string, unknown> | undefined> {
  try {
    const rawContent = await readFile(configurationPath, "utf8");
    return JSON.parse(rawContent) as Record<string, unknown>;
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }
    throw new Error(
      `Failed to load active router configuration at ${configurationPath}: ${formatError(error)}`,
    );
  }
}

export async function saveActiveRouterConfig(
  configuration: Record<string, unknown>,
  configurationPath: string = getGlobalRouterConfigPath(),
): Promise<void> {
  try {
    await mkdir(dirname(configurationPath), { recursive: true });
    const content = `${JSON.stringify(configuration, null, 2)}\n`;
    await writeFile(configurationPath, content, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to write router configuration at ${configurationPath}: ${formatError(error)}`,
    );
  }
}

export function profileToRouterConfig(profile: JevProfile): Record<string, unknown> {
  const routerConfiguration: Record<string, unknown> = {};

  if (typeof profile.useDefaultModels === "boolean") {
    routerConfiguration.useDefaultModels = profile.useDefaultModels;
  }
  if (typeof profile.enabled === "boolean") {
    routerConfiguration.enabled = profile.enabled;
  }
  if (typeof profile.mode === "string") {
    routerConfiguration.mode = profile.mode;
  }
  if (typeof profile.apiKey === "string") {
    routerConfiguration.apiKey = profile.apiKey;
  }
  if (typeof profile.apiKeyEnv === "string") {
    routerConfiguration.apiKeyEnv = profile.apiKeyEnv;
  }
  if (typeof profile.endpoint === "string") {
    routerConfiguration.endpoint = profile.endpoint;
  }
  if (typeof profile.endpointEnv === "string") {
    routerConfiguration.endpointEnv = profile.endpointEnv;
  }
  if (typeof profile.jevModel === "string") {
    routerConfiguration.jevModel = profile.jevModel;
  }
  if (typeof profile.timeoutMs === "number") {
    routerConfiguration.timeoutMs = profile.timeoutMs;
  }
  if (typeof profile.minPromptChars === "number") {
    routerConfiguration.minPromptChars = profile.minPromptChars;
  }
  if (typeof profile.historyTurns === "number") {
    routerConfiguration.historyTurns = profile.historyTurns;
  }
  if (typeof profile.confidenceThreshold === "number") {
    routerConfiguration.confidenceThreshold = profile.confidenceThreshold;
  }
  if (typeof profile.stickiness === "boolean") {
    routerConfiguration.stickiness = profile.stickiness;
  }
  if (typeof profile.stateFile === "string") {
    routerConfiguration.stateFile = profile.stateFile;
  }
  if (profile.routes) {
    routerConfiguration.routes = profile.routes;
  }
  if (profile.kindModels) {
    routerConfiguration.kindModels = profile.kindModels;
  }
  if (profile.kindMinimumTier) {
    routerConfiguration.kindMinimumTier = profile.kindMinimumTier;
  }
  if (profile.free) {
    routerConfiguration.free = profile.free;
  }
  if (profile.budget) {
    routerConfiguration.budget = profile.budget;
  }
  if (profile.cache) {
    routerConfiguration.cache = profile.cache;
  }
  if (profile.taskKinds) {
    routerConfiguration.taskKinds = profile.taskKinds;
  }

  // Preserve any additional custom router properties
  for (const [key, value] of Object.entries(profile)) {
    if (
      key !== "name" &&
      key !== "description" &&
      key !== "recommendedAccounts" &&
      !(key in routerConfiguration)
    ) {
      routerConfiguration[key] = value;
    }
  }

  return routerConfiguration;
}

export function findMatchingProfile(
  activeConfiguration: Record<string, unknown> | undefined,
  profiles: ProfilesCollection,
): string | undefined {
  if (!activeConfiguration) {
    return undefined;
  }

  for (const [profileName, profile] of Object.entries(profiles)) {
    const candidateConfig = profileToRouterConfig(profile);
    if (isConfigurationSubsetEqual(candidateConfig, activeConfiguration)) {
      return profileName;
    }
  }

  return undefined;
}

function isConfigurationSubsetEqual(
  candidate: Record<string, unknown>,
  active: Record<string, unknown>,
): boolean {
  // Check routes match
  if ("routes" in candidate) {
    if (
      JSON.stringify(candidate.routes) !==
      JSON.stringify(active.routes)
    ) {
      return false;
    }
  }

  // Check kindModels match
  if ("kindModels" in candidate) {
    if (
      JSON.stringify(candidate.kindModels) !==
      JSON.stringify(active.kindModels)
    ) {
      return false;
    }
  }

  // Check useDefaultModels match
  if (
    typeof candidate.useDefaultModels === "boolean" &&
    candidate.useDefaultModels !== active.useDefaultModels
  ) {
    return false;
  }

  return true;
}
