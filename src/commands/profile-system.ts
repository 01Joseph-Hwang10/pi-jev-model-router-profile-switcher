import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatError } from "../shared/errors.js";
import { updateStatusBar } from "../shared/ui.js";

export async function handleProfileInit(
  _argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  try {
    const created = await runtime.initializeExampleProfilesIfMissing();
    if (created) {
      updateStatusBar(context.ui, runtime.getActiveProfileName());
      context.ui.notify(
        `Created starter Jev router profiles at ${runtime.getProfilesPath()}.`,
        "info",
      );
    } else {
      context.ui.notify(
        `Profiles file already exists at ${runtime.getProfilesPath()}.`,
        "info",
      );
    }
  } catch (error) {
    context.ui.notify(
      `Failed to initialize profiles: ${formatError(error)}`,
      "error",
    );
  }
}

export async function handleProfileReload(
  _argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  try {
    await runtime.reload();
    updateStatusBar(context.ui, runtime.getActiveProfileName());
    const count = runtime.getProfileNames().length;
    const active = runtime.getActiveProfileName() ?? "none";
    context.ui.notify(
      `Reloaded ${count} Jev router profiles from disk. Active: "${active}".`,
      "info",
    );
  } catch (error) {
    context.ui.notify(
      `Failed to reload profiles: ${formatError(error)}`,
      "error",
    );
  }
}

export function handleProfileHelp(
  _argumentText: string,
  _runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): void {
  const helpText = [
    "pi-jev-model-router-profile-switcher commands:",
    "  /jev-profile [name]       - Switch active profile (interactive picker if omitted)",
    "  /jev-profile switch <name>- Switch to specified profile",
    "  /jev-profile list         - List all profiles and switch interactively",
    "  /jev-profile current      - View current active profile details and routes",
    "  /jev-profile show [name]  - Inspect a profile's full configuration",
    "  /jev-profile add [name]   - Add a new profile interactively or from JSON editor",
    "  /jev-profile save [name]  - Capture current router config into a named profile",
    "  /jev-profile edit [name]  - Edit, rename, or overwrite an existing profile",
    "  /jev-profile clone <s> <t>- Duplicate an existing profile",
    "  /jev-profile remove [name]- Permanently delete a profile",
    "  /jev-profile init         - Create example profiles if missing",
    "  /jev-profile reload       - Reload profiles from disk",
    "",
    "Direct Shortcut Commands:",
    "  /jev-profiles             - Interactive list & switch",
    "  /jev-profile-current      - Show current active profile",
    "  /jev-profile-add          - Add new profile",
    "  /jev-profile-save         - Save current router config as profile",
    "  /jev-profile-edit         - Edit profile",
    "  /jev-profile-remove       - Remove profile",
    "  /jev-profile-show         - Show profile details",
    "  /jev-profile-init         - Initialize starter profiles",
    "  /jev-profile-reload       - Reload from disk",
  ].join("\n");

  context.ui.notify(helpText, "info");
}
