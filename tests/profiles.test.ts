import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  cloneProfile,
  createProfile,
  deleteProfile,
  ensureExampleProfiles,
  getProfile,
  loadProfiles,
  renameProfile,
  saveProfiles,
  updateProfile,
} from "../src/storage/profiles.js";
import type { JevProfile, ProfilesCollection } from "../src/domain/types.js";

describe("Profiles Storage", () => {
  let temporaryDirectory: string;
  let testProfilesPath: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "profiles-test-"));
    testProfilesPath = join(temporaryDirectory, "test-profiles.json");
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("should return empty object when file does not exist", async () => {
    const profiles = await loadProfiles(testProfilesPath);
    expect(profiles).toEqual({});
  });

  it("should save and load profiles successfully", async () => {
    const sampleProfiles: ProfilesCollection = {
      testProfile: {
        description: "Test description",
        useDefaultModels: false,
        routes: {
          quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
        },
      },
    };

    await saveProfiles(sampleProfiles, testProfilesPath);
    const loadedProfiles = await loadProfiles(testProfilesPath);
    expect(loadedProfiles).toEqual(sampleProfiles);
  });

  it("should create a new profile", async () => {
    const newProfile: JevProfile = {
      description: "Newly created profile",
      useDefaultModels: true,
    };

    await createProfile("custom", newProfile, testProfilesPath);
    const profile = await getProfile("custom", testProfilesPath);
    expect(profile).toEqual(newProfile);
  });

  it("should throw when creating duplicate profile", async () => {
    const newProfile: JevProfile = { description: "First" };
    await createProfile("duplicate", newProfile, testProfilesPath);
    await expect(
      createProfile("duplicate", newProfile, testProfilesPath),
    ).rejects.toThrow('Profile "duplicate" already exists.');
  });

  it("should update an existing profile", async () => {
    await createProfile("toUpdate", { description: "Original" }, testProfilesPath);
    await updateProfile("toUpdate", { description: "Modified" }, testProfilesPath);

    const profile = await getProfile("toUpdate", testProfilesPath);
    expect(profile?.description).toBe("Modified");
  });

  it("should delete an existing profile", async () => {
    await createProfile("toDelete", { description: "Will be deleted" }, testProfilesPath);
    await deleteProfile("toDelete", testProfilesPath);

    const profile = await getProfile("toDelete", testProfilesPath);
    expect(profile).toBeUndefined();
  });

  it("should clone an existing profile", async () => {
    await createProfile("source", { description: "Original" }, testProfilesPath);
    await cloneProfile("source", "cloned", testProfilesPath);

    const cloned = await getProfile("cloned", testProfilesPath);
    expect(cloned?.description).toBe("Original");
  });

  it("should rename an existing profile", async () => {
    await createProfile("oldName", { description: "Renamed" }, testProfilesPath);
    await renameProfile("oldName", "newName", testProfilesPath);

    const oldProfile = await getProfile("oldName", testProfilesPath);
    const newProfile = await getProfile("newName", testProfilesPath);
    expect(oldProfile).toBeUndefined();
    expect(newProfile?.description).toBe("Renamed");
  });

  it("should initialize example profiles if missing", async () => {
    const created = await ensureExampleProfiles(testProfilesPath);
    expect(created).toBe(true);

    const loadedProfiles = await loadProfiles(testProfilesPath);
    expect(loadedProfiles.google).toBeDefined();
    expect(loadedProfiles.openrouter).toBeDefined();
    expect(loadedProfiles.zai).toBeDefined();

    // Calling again returns false because file exists
    const secondCall = await ensureExampleProfiles(testProfilesPath);
    expect(secondCall).toBe(false);
  });
});
