import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { handleProfileAdd } from "./profile-add.js";
import { handleProfileClone } from "./profile-clone.js";
import { handleProfileCurrent } from "./profile-current.js";
import { handleProfileEdit } from "./profile-edit.js";
import { handleProfileList } from "./profile-list.js";
import { handleProfileRemove } from "./profile-remove.js";
import { handleProfileSave } from "./profile-save.js";
import { handleProfileShow } from "./profile-show.js";
import { handleProfileSwitch } from "./profile-switch.js";
import {
  handleProfileHelp,
  handleProfileInit,
  handleProfileReload,
} from "./profile-system.js";

const SUBCOMMANDS = [
  { name: "switch", description: "Switch active Jev router profile" },
  { name: "list", description: "List all profiles and switch interactively" },
  { name: "current", description: "Show current active profile and routes" },
  { name: "show", description: "Show detailed configuration of a profile" },
  { name: "add", description: "Create a new profile" },
  { name: "save", description: "Save active router configuration as a profile" },
  { name: "edit", description: "Edit an existing profile" },
  { name: "clone", description: "Duplicate an existing profile" },
  { name: "remove", description: "Delete an existing profile" },
  { name: "reload", description: "Reload profiles from disk" },
  { name: "init", description: "Initialize example profiles if missing" },
  { name: "help", description: "Show help and command reference" },
];

export function registerProfileCommands(
  pi: ExtensionAPI,
  runtime: ProfileSwitcherRuntime,
): void {
  // Master command: /jev-profile
  pi.registerCommand("jev-profile", {
    description: "Manage and switch Jev model router profiles (CRUD, switch, save)",
    getArgumentCompletions: async (argumentPrefix: string) => {
      await runtime.reload();
      const prefix = argumentPrefix.trim().toLowerCase();
      const profileNames = runtime.getProfileNames();

      const items: Array<{ value: string; label: string; description?: string }> = [];

      for (const subcommand of SUBCOMMANDS) {
        if (!prefix || subcommand.name.startsWith(prefix)) {
          items.push({
            value: subcommand.name,
            label: subcommand.name,
            description: subcommand.description,
          });
        }
      }

      for (const name of profileNames) {
        if (!prefix || name.toLowerCase().startsWith(prefix)) {
          const profile = runtime.getProfile(name);
          items.push({
            value: name,
            label: name,
            description: profile?.description ?? `Switch to ${name} profile`,
          });
        }
      }

      return items;
    },
    handler: async (argumentText, context) => {
      const trimmed = argumentText.trim();
      const [firstWord, ...restWords] = trimmed.split(/\s+/).filter(Boolean);
      const restArgument = restWords.join(" ");

      if (!firstWord) {
        await handleProfileSwitch("", runtime, context);
        return;
      }

      switch (firstWord.toLowerCase()) {
        case "switch":
          await handleProfileSwitch(restArgument, runtime, context);
          return;
        case "list":
          await handleProfileList(restArgument, runtime, context);
          return;
        case "current":
          await handleProfileCurrent(restArgument, runtime, context);
          return;
        case "show":
          await handleProfileShow(restArgument, runtime, context);
          return;
        case "add":
          await handleProfileAdd(restArgument, runtime, context);
          return;
        case "save":
          await handleProfileSave(restArgument, runtime, context);
          return;
        case "edit":
          await handleProfileEdit(restArgument, runtime, context);
          return;
        case "remove":
        case "delete":
          await handleProfileRemove(restArgument, runtime, context);
          return;
        case "clone":
        case "copy":
          await handleProfileClone(restArgument, runtime, context);
          return;
        case "reload":
          await handleProfileReload(restArgument, runtime, context);
          return;
        case "init":
          await handleProfileInit(restArgument, runtime, context);
          return;
        case "help":
          handleProfileHelp(restArgument, runtime, context);
          return;
        default:
          // If the first word matches a profile name, switch to it directly
          if (runtime.getProfile(firstWord)) {
            await handleProfileSwitch(firstWord, runtime, context);
          } else {
            // Otherwise pass to switch which will report or prompt
            await handleProfileSwitch(trimmed, runtime, context);
          }
          return;
      }
    },
  });

  // Dedicated shortcuts
  pi.registerCommand("jev-profiles", {
    description: "List Jev model router profiles and select one to switch",
    handler: async (argumentText, context) => {
      await handleProfileList(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-current", {
    description: "Show the currently active Jev model router profile",
    handler: async (argumentText, context) => {
      await handleProfileCurrent(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-show", {
    description: "Show configuration details of a Jev model router profile",
    getArgumentCompletions: async (argumentPrefix: string) => {
      await runtime.reload();
      const prefix = argumentPrefix.trim().toLowerCase();
      return runtime
        .getProfileNames()
        .filter((name) => !prefix || name.toLowerCase().startsWith(prefix))
        .map((name) => ({
          value: name,
          label: name,
          description: runtime.getProfile(name)?.description,
        }));
    },
    handler: async (argumentText, context) => {
      await handleProfileShow(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-add", {
    description: "Create a new Jev model router profile",
    handler: async (argumentText, context) => {
      await handleProfileAdd(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-save", {
    description: "Save current active router configuration as a profile",
    handler: async (argumentText, context) => {
      await handleProfileSave(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-edit", {
    description: "Edit, rename, or overwrite an existing Jev model router profile",
    getArgumentCompletions: async (argumentPrefix: string) => {
      await runtime.reload();
      const prefix = argumentPrefix.trim().toLowerCase();
      return runtime
        .getProfileNames()
        .filter((name) => !prefix || name.toLowerCase().startsWith(prefix))
        .map((name) => ({
          value: name,
          label: name,
          description: runtime.getProfile(name)?.description,
        }));
    },
    handler: async (argumentText, context) => {
      await handleProfileEdit(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-remove", {
    description: "Permanently delete a Jev model router profile",
    getArgumentCompletions: async (argumentPrefix: string) => {
      await runtime.reload();
      const prefix = argumentPrefix.trim().toLowerCase();
      return runtime
        .getProfileNames()
        .filter((name) => !prefix || name.toLowerCase().startsWith(prefix))
        .map((name) => ({
          value: name,
          label: name,
          description: runtime.getProfile(name)?.description,
        }));
    },
    handler: async (argumentText, context) => {
      await handleProfileRemove(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-clone", {
    description: "Clone an existing Jev model router profile to a new name",
    getArgumentCompletions: async (argumentPrefix: string) => {
      await runtime.reload();
      const prefix = argumentPrefix.trim().toLowerCase();
      return runtime
        .getProfileNames()
        .filter((name) => !prefix || name.toLowerCase().startsWith(prefix))
        .map((name) => ({
          value: name,
          label: name,
          description: runtime.getProfile(name)?.description,
        }));
    },
    handler: async (argumentText, context) => {
      await handleProfileClone(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-reload", {
    description: "Reload Jev router profiles from disk",
    handler: async (argumentText, context) => {
      await handleProfileReload(argumentText, runtime, context);
    },
  });

  pi.registerCommand("jev-profile-init", {
    description: "Initialize starter Jev model router profiles file if missing",
    handler: async (argumentText, context) => {
      await handleProfileInit(argumentText, runtime, context);
    },
  });
}
