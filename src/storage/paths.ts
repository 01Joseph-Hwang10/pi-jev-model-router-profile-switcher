import { homedir } from "node:os";
import { join } from "node:path";

export const CONFIG_DIRECTORY_NAME = ".pi";
export const PROFILES_FILE_NAME = "pi-jev-model-router-profiles.json";
export const ROUTER_CONFIG_FILE_NAME = "pi-jev-model-router.json";
export const STATE_FILE_NAME = "pi-jev-model-router-profile-switcher-state.json";

export function getGlobalAgentDirectory(): string {
  return join(homedir(), CONFIG_DIRECTORY_NAME, "agent");
}

export function getGlobalProfilesPath(): string {
  return join(getGlobalAgentDirectory(), PROFILES_FILE_NAME);
}

export function getGlobalRouterConfigPath(): string {
  return join(getGlobalAgentDirectory(), ROUTER_CONFIG_FILE_NAME);
}

export function getGlobalStatePath(): string {
  return join(getGlobalAgentDirectory(), STATE_FILE_NAME);
}

export function getProjectProfilesPath(currentWorkingDirectory: string): string {
  return join(currentWorkingDirectory, CONFIG_DIRECTORY_NAME, PROFILES_FILE_NAME);
}

export function getProjectRouterConfigPath(currentWorkingDirectory: string): string {
  return join(currentWorkingDirectory, CONFIG_DIRECTORY_NAME, ROUTER_CONFIG_FILE_NAME);
}

export function getAccountSwitcherAccountsPath(): string {
  return join(homedir(), CONFIG_DIRECTORY_NAME, "account-switcher", "accounts.json");
}

export function getAccountSwitcherStatePath(): string {
  return join(homedir(), CONFIG_DIRECTORY_NAME, "account-switcher", "state.json");
}
