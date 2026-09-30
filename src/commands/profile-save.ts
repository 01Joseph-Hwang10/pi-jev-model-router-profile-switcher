import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatError } from "../shared/errors.js";
import { updateStatusBar } from "../shared/ui.js";

export async function handleProfileSave(
  argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  let targetProfileName = argumentText.trim();
  if (!targetProfileName) {
    const inputName = await context.ui.input(
      "Save current router configuration as profile name:",
      runtime.getActiveProfileName() ?? "my-profile",
    );
    if (!inputName || !inputName.trim()) {
      return;
    }
    targetProfileName = inputName.trim();
  }

  const existingProfile = runtime.getProfile(targetProfileName);
  if (existingProfile) {
    const shouldOverwrite = await context.ui.confirm(
      "Overwrite Existing Profile",
      `Profile "${targetProfileName}" already exists. Do you want to overwrite it with the current active router configuration?`,
    );
    if (!shouldOverwrite) {
      context.ui.notify("Save profile cancelled.", "info");
      return;
    }
  }

  const description = await context.ui.input(
    "Optional description for this profile:",
    existingProfile?.description ?? "Captured from active pi-jev-model-router.json",
  );

  try {
    await runtime.saveCurrentRouterConfigAsProfile(
      targetProfileName,
      description?.trim(),
    );
    updateStatusBar(context.ui, targetProfileName);
    context.ui.notify(
      `Successfully saved current router configuration as profile "${targetProfileName}".`,
      "info",
    );
  } catch (error) {
    context.ui.notify(
      `Failed to save profile: ${formatError(error)}`,
      "error",
    );
  }
}
