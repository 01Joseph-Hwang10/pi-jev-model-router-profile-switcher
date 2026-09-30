import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ProfileSwitcherState } from "../domain/types.js";
import { formatError, isMissingFileError } from "../shared/errors.js";
import { getGlobalStatePath } from "./paths.js";

const DEFAULT_STATE: ProfileSwitcherState = {};

export async function loadState(
  statePath: string = getGlobalStatePath(),
): Promise<ProfileSwitcherState> {
  try {
    const rawContent = await readFile(statePath, "utf8");
    const parsed = JSON.parse(rawContent) as Partial<ProfileSwitcherState>;
    return {
      activeProfile:
        typeof parsed.activeProfile === "string" ? parsed.activeProfile : undefined,
      lastSwitchedAt:
        typeof parsed.lastSwitchedAt === "string" ? parsed.lastSwitchedAt : undefined,
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return { ...DEFAULT_STATE };
    }
    throw new Error(
      `Failed to load profile switcher state at ${statePath}: ${formatError(error)}`,
    );
  }
}

export async function saveState(
  state: ProfileSwitcherState,
  statePath: string = getGlobalStatePath(),
): Promise<void> {
  try {
    await mkdir(dirname(statePath), { recursive: true });
    const content = `${JSON.stringify(state, null, 2)}\n`;
    await writeFile(statePath, content, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to save profile switcher state at ${statePath}: ${formatError(error)}`,
    );
  }
}

export async function saveActiveProfile(
  activeProfileName: string,
  statePath: string = getGlobalStatePath(),
): Promise<void> {
  const currentState = await loadState(statePath);
  const nextState: ProfileSwitcherState = {
    ...currentState,
    activeProfile: activeProfileName,
    lastSwitchedAt: new Date().toISOString(),
  };
  await saveState(nextState, statePath);
}

export async function clearActiveProfile(
  statePath: string = getGlobalStatePath(),
): Promise<void> {
  const currentState = await loadState(statePath);
  const nextState: ProfileSwitcherState = {
    ...currentState,
    activeProfile: undefined,
  };
  await saveState(nextState, statePath);
}
