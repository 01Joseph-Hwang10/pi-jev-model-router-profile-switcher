import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  findMatchingProfile,
  loadActiveRouterConfig,
  profileToRouterConfig,
  saveActiveRouterConfig,
} from "../src/storage/router-config.js";
import type { JevProfile, ProfilesCollection } from "../src/domain/types.js";

describe("Router Configuration Storage", () => {
  let temporaryDirectory: string;
  let testRouterConfigPath: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "router-config-test-"));
    testRouterConfigPath = join(temporaryDirectory, "test-router-config.json");
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("should return undefined when active router config does not exist", async () => {
    const config = await loadActiveRouterConfig(testRouterConfigPath);
    expect(config).toBeUndefined();
  });

  it("should save and load active router config", async () => {
    const config = {
      useDefaultModels: false,
      routes: {
        quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
      },
    };

    await saveActiveRouterConfig(config, testRouterConfigPath);
    const loadedConfig = await loadActiveRouterConfig(testRouterConfigPath);
    expect(loadedConfig).toEqual(config);
  });

  it("should convert a profile to router config without metadata fields", () => {
    const profile: JevProfile = {
      name: "test",
      description: "A test profile",
      recommendedAccounts: { google: "work" },
      useDefaultModels: false,
      routes: {
        quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
      },
    };

    const routerConfig = profileToRouterConfig(profile);
    expect(routerConfig.description).toBeUndefined();
    expect(routerConfig.recommendedAccounts).toBeUndefined();
    expect(routerConfig.useDefaultModels).toBe(false);
    expect(routerConfig.routes).toEqual(profile.routes);
  });

  it("should find matching profile by comparing routes and settings", () => {
    const profiles: ProfilesCollection = {
      google: {
        useDefaultModels: false,
        routes: {
          quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
          standard: [{ provider: "google", model: "gemini-3.8-flash" }],
        },
      },
      zai: {
        useDefaultModels: false,
        routes: {
          quick: [{ provider: "zai", model: "glm-5.3-flash" }],
          standard: [{ provider: "zai", model: "glm-5.3" }],
        },
      },
    };

    const activeConfig = {
      useDefaultModels: false,
      routes: {
        quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
        standard: [{ provider: "google", model: "gemini-3.8-flash" }],
      },
    };

    const match = findMatchingProfile(activeConfig, profiles);
    expect(match).toBe("google");
  });
});
