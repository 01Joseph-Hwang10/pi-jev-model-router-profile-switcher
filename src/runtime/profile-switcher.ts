import type {
  JevProfile,
  ProfilesCollection,
  ProfileSummary,
  SwitchResult,
} from "../domain/types.js";
import {
  extractProvidersFromProfile,
  getProfileSummary,
} from "../shared/format.js";
import {
  cloneProfile,
  createProfile,
  deleteProfile,
  ensureExampleProfiles,
  loadProfiles,
  renameProfile,
  saveProfiles,
  updateProfile,
} from "../storage/profiles.js";
import {
  findMatchingProfile,
  loadActiveRouterConfig,
  profileToRouterConfig,
  saveActiveRouterConfig,
} from "../storage/router-config.js";
import {
  clearActiveProfile,
  loadState,
  saveActiveProfile,
} from "../storage/state.js";
import {
  getGlobalProfilesPath,
  getGlobalRouterConfigPath,
  getGlobalStatePath,
  getProjectProfilesPath,
  getProjectRouterConfigPath,
} from "../storage/paths.js";

export interface ProfileSwitcherRuntimeOptions {
  currentWorkingDirectory?: string;
  useProjectScope?: boolean;
}

export class ProfileSwitcherRuntime {
  private profiles: ProfilesCollection = {};
  private activeProfileName: string | undefined;
  private profilesPath: string;
  private routerConfigPath: string;
  private statePath: string;

  constructor(options: ProfileSwitcherRuntimeOptions = {}) {
    const cwd = options.currentWorkingDirectory ?? process.cwd();
    if (options.useProjectScope) {
      this.profilesPath = getProjectProfilesPath(cwd);
      this.routerConfigPath = getProjectRouterConfigPath(cwd);
    } else {
      this.profilesPath = getGlobalProfilesPath();
      this.routerConfigPath = getGlobalRouterConfigPath();
    }
    this.statePath = getGlobalStatePath();
  }

  public getProfilesPath(): string {
    return this.profilesPath;
  }

  public getRouterConfigPath(): string {
    return this.routerConfigPath;
  }

  public getStatePath(): string {
    return this.statePath;
  }

  public async initialize(): Promise<void> {
    await this.reload();
  }

  public async reload(): Promise<void> {
    this.profiles = await loadProfiles(this.profilesPath);
    this.activeProfileName = await this.detectActiveProfile();
  }

  public getActiveProfileName(): string | undefined {
    return this.activeProfileName;
  }

  public getActiveProfile(): JevProfile | undefined {
    if (!this.activeProfileName) {
      return undefined;
    }
    return this.profiles[this.activeProfileName];
  }

  public getProfile(profileName: string): JevProfile | undefined {
    return this.profiles[profileName];
  }

  public getAllProfiles(): ProfilesCollection {
    return { ...this.profiles };
  }

  public getProfileNames(): string[] {
    return Object.keys(this.profiles);
  }

  public getProfileSummaries(): ProfileSummary[] {
    return Object.entries(this.profiles).map(([name, profile]) =>
      getProfileSummary(name, profile, name === this.activeProfileName),
    );
  }

  public async detectActiveProfile(): Promise<string | undefined> {
    const state = await loadState(this.statePath);

    // 1. If state has an activeProfile and it exists in current profiles, check if it matches router config
    if (state.activeProfile && state.activeProfile in this.profiles) {
      return state.activeProfile;
    }

    // 2. Otherwise inspect the active router config and find a matching profile
    const activeConfig = await loadActiveRouterConfig(this.routerConfigPath);
    const matchedProfile = findMatchingProfile(activeConfig, this.profiles);

    if (matchedProfile) {
      await saveActiveProfile(matchedProfile, this.statePath);
      return matchedProfile;
    }

    return undefined;
  }

  public async switchProfile(
    profileName: string,
    reloadFunction?: () => Promise<void>,
  ): Promise<SwitchResult> {
    const normalizedName = profileName.trim();
    const targetProfile = this.profiles[normalizedName];

    if (!targetProfile) {
      throw new Error(
        `Profile "${normalizedName}" does not exist. Available profiles: ${Object.keys(this.profiles).join(", ")}`,
      );
    }

    const previousProfileName = this.activeProfileName;
    const routerConfig = profileToRouterConfig(targetProfile);

    // Write to router config file
    await saveActiveRouterConfig(routerConfig, this.routerConfigPath);

    // Save active profile in state
    await saveActiveProfile(normalizedName, this.statePath);
    this.activeProfileName = normalizedName;

    const providers = extractProvidersFromProfile(targetProfile);
    let reloaded = false;

    if (typeof reloadFunction === "function") {
      try {
        await reloadFunction();
        reloaded = true;
      } catch {
        reloaded = false;
      }
    }

    return {
      previousProfileName,
      currentProfileName: normalizedName,
      routerConfigurationPath: this.routerConfigPath,
      providers,
      reloaded,
    };
  }

  public async saveCurrentRouterConfigAsProfile(
    profileName: string,
    description?: string,
  ): Promise<void> {
    const normalizedName = profileName.trim();
    if (!normalizedName) {
      throw new Error("Profile name cannot be empty.");
    }

    const currentConfig = await loadActiveRouterConfig(this.routerConfigPath);
    if (!currentConfig) {
      throw new Error(
        `No active router configuration found at ${this.routerConfigPath} to save.`,
      );
    }

    const newProfile: JevProfile = {
      ...(description ? { description } : {}),
      ...currentConfig,
    };

    this.profiles[normalizedName] = newProfile;
    await saveProfiles(this.profiles, this.profilesPath);
    await saveActiveProfile(normalizedName, this.statePath);
    this.activeProfileName = normalizedName;
  }

  public async createProfile(
    profileName: string,
    profile: JevProfile,
  ): Promise<void> {
    await createProfile(profileName, profile, this.profilesPath);
    this.profiles[profileName] = profile;
  }

  public async updateProfile(
    profileName: string,
    profile: JevProfile,
  ): Promise<void> {
    await updateProfile(profileName, profile, this.profilesPath);
    this.profiles[profileName] = profile;

    // If updated profile is active, also re-apply to active router config
    if (this.activeProfileName === profileName) {
      const routerConfig = profileToRouterConfig(profile);
      await saveActiveRouterConfig(routerConfig, this.routerConfigPath);
    }
  }

  public async deleteProfile(profileName: string): Promise<void> {
    await deleteProfile(profileName, this.profilesPath);
    delete this.profiles[profileName];

    if (this.activeProfileName === profileName) {
      await clearActiveProfile(this.statePath);
      this.activeProfileName = undefined;
    }
  }

  public async cloneProfile(
    sourceProfileName: string,
    targetProfileName: string,
  ): Promise<void> {
    await cloneProfile(sourceProfileName, targetProfileName, this.profilesPath);
    this.profiles[targetProfileName] = structuredClone(
      this.profiles[sourceProfileName],
    );
  }

  public async renameProfile(
    oldProfileName: string,
    newProfileName: string,
  ): Promise<void> {
    await renameProfile(oldProfileName, newProfileName, this.profilesPath);
    this.profiles[newProfileName] = this.profiles[oldProfileName];
    delete this.profiles[oldProfileName];

    if (this.activeProfileName === oldProfileName) {
      await saveActiveProfile(newProfileName, this.statePath);
      this.activeProfileName = newProfileName;
    }
  }

  public async initializeExampleProfilesIfMissing(): Promise<boolean> {
    const created = await ensureExampleProfiles(this.profilesPath);
    if (created) {
      await this.reload();
    }
    return created;
  }
}
