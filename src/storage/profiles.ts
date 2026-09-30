import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { JevProfile, ProfilesCollection } from "../domain/types.js";
import { formatError, isMissingFileError } from "../shared/errors.js";
import { getGlobalProfilesPath } from "./paths.js";

export async function loadProfiles(
  filePath: string = getGlobalProfilesPath(),
): Promise<ProfilesCollection> {
  try {
    const rawContent = await readFile(filePath, "utf8");
    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Profiles file content must be a JSON object mapping names to profiles.");
    }
    return parsed as ProfilesCollection;
  } catch (error) {
    if (isMissingFileError(error)) {
      return {};
    }
    throw new Error(
      `Failed to load Jev router profiles from ${filePath}: ${formatError(error)}`,
    );
  }
}

export async function saveProfiles(
  profiles: ProfilesCollection,
  filePath: string = getGlobalProfilesPath(),
): Promise<void> {
  try {
    await mkdir(dirname(filePath), { recursive: true });
    const content = `${JSON.stringify(profiles, null, 2)}\n`;
    await writeFile(filePath, content, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to save Jev router profiles to ${filePath}: ${formatError(error)}`,
    );
  }
}

export async function getProfile(
  profileName: string,
  filePath: string = getGlobalProfilesPath(),
): Promise<JevProfile | undefined> {
  const profiles = await loadProfiles(filePath);
  return profiles[profileName];
}

export async function createProfile(
  profileName: string,
  profile: JevProfile,
  filePath: string = getGlobalProfilesPath(),
): Promise<void> {
  const normalizedName = profileName.trim();
  if (!normalizedName) {
    throw new Error("Profile name cannot be empty.");
  }
  const profiles = await loadProfiles(filePath);
  if (normalizedName in profiles) {
    throw new Error(`Profile "${normalizedName}" already exists.`);
  }
  profiles[normalizedName] = profile;
  await saveProfiles(profiles, filePath);
}

export async function updateProfile(
  profileName: string,
  profile: JevProfile,
  filePath: string = getGlobalProfilesPath(),
): Promise<void> {
  const normalizedName = profileName.trim();
  const profiles = await loadProfiles(filePath);
  if (!(normalizedName in profiles)) {
    throw new Error(`Profile "${normalizedName}" does not exist.`);
  }
  profiles[normalizedName] = profile;
  await saveProfiles(profiles, filePath);
}

export async function deleteProfile(
  profileName: string,
  filePath: string = getGlobalProfilesPath(),
): Promise<void> {
  const normalizedName = profileName.trim();
  const profiles = await loadProfiles(filePath);
  if (!(normalizedName in profiles)) {
    throw new Error(`Profile "${normalizedName}" does not exist.`);
  }
  delete profiles[normalizedName];
  await saveProfiles(profiles, filePath);
}

export async function cloneProfile(
  sourceProfileName: string,
  targetProfileName: string,
  filePath: string = getGlobalProfilesPath(),
): Promise<void> {
  const normalizedSource = sourceProfileName.trim();
  const normalizedTarget = targetProfileName.trim();
  if (!normalizedTarget) {
    throw new Error("Target profile name cannot be empty.");
  }
  const profiles = await loadProfiles(filePath);
  if (!(normalizedSource in profiles)) {
    throw new Error(`Source profile "${normalizedSource}" does not exist.`);
  }
  if (normalizedTarget in profiles) {
    throw new Error(`Target profile "${normalizedTarget}" already exists.`);
  }
  profiles[normalizedTarget] = structuredClone(profiles[normalizedSource]);
  await saveProfiles(profiles, filePath);
}

export async function renameProfile(
  oldProfileName: string,
  newProfileName: string,
  filePath: string = getGlobalProfilesPath(),
): Promise<void> {
  const normalizedOld = oldProfileName.trim();
  const normalizedNew = newProfileName.trim();
  if (!normalizedNew) {
    throw new Error("New profile name cannot be empty.");
  }
  if (normalizedOld === normalizedNew) {
    return;
  }
  const profiles = await loadProfiles(filePath);
  if (!(normalizedOld in profiles)) {
    throw new Error(`Profile "${normalizedOld}" does not exist.`);
  }
  if (normalizedNew in profiles) {
    throw new Error(`A profile with name "${normalizedNew}" already exists.`);
  }
  profiles[normalizedNew] = profiles[normalizedOld];
  delete profiles[normalizedOld];
  await saveProfiles(profiles, filePath);
}

export async function ensureExampleProfiles(
  filePath: string = getGlobalProfilesPath(),
): Promise<boolean> {
  try {
    await readFile(filePath, "utf8");
    return false; // Already exists
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  const exampleProfiles: ProfilesCollection = {
    google: {
      description: "Direct Google Gemini models for fast, cost-efficient routing",
      useDefaultModels: false,
      routes: {
        quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
        standard: [{ provider: "google", model: "gemini-3.8-flash" }],
        high: [{ provider: "google", model: "gemini-3.8-flash" }],
        premium: [{ provider: "google", model: "gemini-3.8-flash" }],
      },
      kindModels: {
        plan: [{ provider: "google", model: "gemini-3.8-flash", minTier: "high" }],
        implement: [{ provider: "google", model: "gemini-3.8-flash", minTier: "standard" }],
        debug: [{ provider: "google", model: "gemini-3.8-flash", minTier: "standard" }],
        review: [{ provider: "google", model: "gemini-3.8-flash", minTier: "high" }],
        explain: [{ provider: "google", model: "gemini-3.5-flash-lite", minTier: "quick" }],
        chat: [{ provider: "google", model: "gemini-3.5-flash-lite", minTier: "quick" }],
      },
    },
    openrouter: {
      description: "OpenRouter multi-provider chain with Claude, GPT, and DeepSeek",
      useDefaultModels: true,
      routes: {
        quick: [
          { provider: "openrouter", model: "~google/gemini-flash-latest" },
          { provider: "openrouter", model: "~openai/gpt-luna-latest" },
        ],
        standard: [
          { provider: "openrouter", model: "~deepseek/deepseek-pro-latest" },
          { provider: "openrouter", model: "openai/gpt-5.4-mini" },
        ],
        high: [
          { provider: "openrouter", model: "~anthropic/claude-sonnet-latest" },
          { provider: "openrouter", model: "~openai/gpt-terra-latest" },
        ],
        premium: [
          { provider: "openrouter", model: "~anthropic/claude-opus-latest" },
          { provider: "openrouter", model: "openai/gpt-5.5" },
        ],
      },
    },
    zai: {
      description: "Z.ai GLM models for specialized reasoning and code generation",
      useDefaultModels: false,
      routes: {
        quick: [{ provider: "zai", model: "glm-5.3-flash" }],
        standard: [{ provider: "zai", model: "glm-5.3" }],
        high: [{ provider: "zai", model: "glm-5.3" }],
        premium: [{ provider: "zai", model: "glm-5.3" }],
      },
      kindModels: {
        plan: [{ provider: "zai", model: "glm-5.3", minTier: "high" }],
        implement: [{ provider: "zai", model: "glm-5.3", minTier: "standard" }],
        debug: [{ provider: "zai", model: "glm-5.3", minTier: "standard" }],
        review: [{ provider: "zai", model: "glm-5.3", minTier: "high" }],
        explain: [{ provider: "zai", model: "glm-5.3-flash", minTier: "quick" }],
        chat: [{ provider: "zai", model: "glm-5.3-flash", minTier: "quick" }],
      },
    },
  };

  await saveProfiles(exampleProfiles, filePath);
  return true;
}
