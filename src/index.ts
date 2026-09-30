import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerProfileCommands } from "./commands/register.js";
import { ProfileSwitcherRuntime } from "./runtime/profile-switcher.js";
import { updateStatusBar } from "./shared/ui.js";

export default async function profileSwitcher(pi: ExtensionAPI): Promise<void> {
  const runtime = new ProfileSwitcherRuntime();
  await runtime.initialize();

  pi.on("session_start", async (_event, context) => {
    await runtime.reload();
    updateStatusBar(context.ui, runtime.getActiveProfileName());
  });

  registerProfileCommands(pi, runtime);
}

export { ProfileSwitcherRuntime } from "./runtime/profile-switcher.js";
export * from "./domain/types.js";
export * from "./storage/paths.js";
export * from "./storage/profiles.js";
export * from "./storage/router-config.js";
export * from "./storage/state.js";
export * from "./storage/account-switcher.js";
