import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatError } from "../shared/errors.js";
import { promptSelectProfile, updateStatusBar } from "../shared/ui.js";

export async function handleProfileRemove(
  argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  let targetProfileName = argumentText.trim();
  if (!targetProfileName) {
    const selected = await promptSelectProfile(
      context.ui,
      "Select Jev Router Profile to Remove",
      runtime,
    );
    if (!selected) {
      return;
    }
    targetProfileName = selected;
  }

  const existingProfile = runtime.getProfile(targetProfileName);
  if (!existingProfile) {
    context.ui.notify(
      `Profile "${targetProfileName}" does not exist.`,
      "error",
    );
    return;
  }

  const isActive = runtime.getActiveProfileName() === targetProfileName;
  const activeWarning = isActive
    ? " (Note: This is the currently active profile! Active state will be cleared.)"
    : "";

  const shouldDelete = await context.ui.confirm(
    "Delete Profile",
    `Are you sure you want to permanently delete profile "${targetProfileName}"?${activeWarning}`,
  );

  if (!shouldDelete) {
    context.ui.notify("Deletion cancelled.", "info");
    return;
  }

  try {
    await runtime.deleteProfile(targetProfileName);
    if (isActive) {
      updateStatusBar(context.ui, undefined);
    }
    context.ui.notify(
      `Successfully deleted profile "${targetProfileName}".`,
      "info",
    );
  } catch (error) {
    context.ui.notify(
      `Failed to delete profile: ${formatError(error)}`,
      "error",
    );
  }
}
