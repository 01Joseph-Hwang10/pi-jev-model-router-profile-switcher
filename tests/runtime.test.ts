import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProfileSwitcherRuntime } from "../src/runtime/profile-switcher.js";
import { saveProfiles } from "../src/storage/profiles.js";
import { loadActiveRouterConfig } from "../src/storage/router-config.js";
import { loadState } from "../src/storage/state.js";
import type { ProfilesCollection } from "../src/domain/types.js";

describe("ProfileSwitcherRuntime", () => {
  let temporaryDirectory: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "runtime-test-"));
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("should initialize and load profiles", async () => {
    const runtime = new ProfileSwitcherRuntime({
      currentWorkingDirectory: temporaryDirectory,
      useProjectScope: true,
    });

    const sampleProfiles: ProfilesCollection = {
      google: {
        description: "Google Gemini",
        useDefaultModels: false,
        routes: {
          quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
        },
      },
      zai: {
        description: "Zai GLM",
        useDefaultModels: false,
        routes: {
          quick: [{ provider: "zai", model: "glm-5.3-flash" }],
        },
      },
    };

    await saveProfiles(sampleProfiles, runtime.getProfilesPath());
    await runtime.initialize();

    expect(runtime.getProfileNames()).toEqual(["google", "zai"]);
    expect(runtime.getProfile("google")?.description).toBe("Google Gemini");
  });

  it("should switch profile and write to router config and state", async () => {
    const runtime = new ProfileSwitcherRuntime({
      currentWorkingDirectory: temporaryDirectory,
      useProjectScope: true,
    });

    const sampleProfiles: ProfilesCollection = {
      google: {
        useDefaultModels: false,
        routes: {
          quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
        },
      },
    };

    await saveProfiles(sampleProfiles, runtime.getProfilesPath());
    await runtime.initialize();

    let reloadCalled = false;
    const result = await runtime.switchProfile("google", async () => {
      reloadCalled = true;
    });

    expect(result.currentProfileName).toBe("google");
    expect(result.reloaded).toBe(true);
    expect(reloadCalled).toBe(true);
    expect(runtime.getActiveProfileName()).toBe("google");

    // Verify router config on disk
    const routerConfig = await loadActiveRouterConfig(runtime.getRouterConfigPath());
    expect(routerConfig?.useDefaultModels).toBe(false);
    expect(routerConfig?.routes).toEqual(sampleProfiles.google.routes);

    // Verify state on disk
    const state = await loadState(runtime.getStatePath());
    expect(state.activeProfile).toBe("google");
  });

  it("should throw when switching to non-existent profile", async () => {
    const runtime = new ProfileSwitcherRuntime({
      currentWorkingDirectory: temporaryDirectory,
      useProjectScope: true,
    });
    await runtime.initialize();

    await expect(runtime.switchProfile("nonexistent")).rejects.toThrow(
      'Profile "nonexistent" does not exist.',
    );
  });

  it("should capture and save active router config as a new profile", async () => {
    const runtime = new ProfileSwitcherRuntime({
      currentWorkingDirectory: temporaryDirectory,
      useProjectScope: true,
    });

    // Seed profiles with initial one and switch to it
    await runtime.createProfile("initial", {
      useDefaultModels: false,
      routes: {
        quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
      },
    });
    await runtime.switchProfile("initial");

    // Save as another profile
    await runtime.saveCurrentRouterConfigAsProfile("savedSnapshot", "Snapshot of active config");

    expect(runtime.getProfile("savedSnapshot")?.description).toBe("Snapshot of active config");
    expect(runtime.getActiveProfileName()).toBe("savedSnapshot");
  });

  it("should return profile summaries", async () => {
    const runtime = new ProfileSwitcherRuntime({
      currentWorkingDirectory: temporaryDirectory,
      useProjectScope: true,
    });

    await runtime.createProfile("google", {
      description: "Google Gemini models",
      useDefaultModels: false,
      routes: {
        quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
        standard: [{ provider: "google", model: "gemini-3.8-flash" }],
      },
      kindModels: {
        plan: [{ provider: "google", model: "gemini-3.8-flash", minTier: "high" }],
      },
    });

    const summaries = runtime.getProfileSummaries();
    expect(summaries.length).toBe(1);
    expect(summaries[0].name).toBe("google");
    expect(summaries[0].providers).toEqual(["google"]);
    expect(summaries[0].kindModelCount).toBe(1);
    expect(summaries[0].routesSummary.quick).toBe("google/gemini-3.5-flash-lite");
  });
});
