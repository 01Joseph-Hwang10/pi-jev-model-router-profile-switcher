import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  clearActiveProfile,
  loadState,
  saveActiveProfile,
  saveState,
} from "../src/storage/state.js";

describe("State Storage", () => {
  let temporaryDirectory: string;
  let testStatePath: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "state-test-"));
    testStatePath = join(temporaryDirectory, "test-state.json");
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("should return empty state when file does not exist", async () => {
    const state = await loadState(testStatePath);
    expect(state).toEqual({});
  });

  it("should save and load state", async () => {
    await saveState({ activeProfile: "google" }, testStatePath);
    const loadedState = await loadState(testStatePath);
    expect(loadedState.activeProfile).toBe("google");
  });

  it("should save active profile and record lastSwitchedAt timestamp", async () => {
    await saveActiveProfile("zai", testStatePath);
    const loadedState = await loadState(testStatePath);
    expect(loadedState.activeProfile).toBe("zai");
    expect(loadedState.lastSwitchedAt).toBeDefined();
  });

  it("should clear active profile", async () => {
    await saveActiveProfile("zai", testStatePath);
    await clearActiveProfile(testStatePath);
    const loadedState = await loadState(testStatePath);
    expect(loadedState.activeProfile).toBeUndefined();
  });
});
