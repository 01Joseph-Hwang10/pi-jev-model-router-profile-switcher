import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { JevProfile } from "../domain/types.js";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatError } from "../shared/errors.js";
import { promptSelectProfile } from "../shared/ui.js";
import { loadActiveRouterConfig } from "../storage/router-config.js";

export async function handleProfileEdit(
  argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  let targetProfileName = argumentText.trim();
  if (!targetProfileName) {
    const selected = await promptSelectProfile(
      context.ui,
      "Select Jev Router Profile to Edit",
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

  const editActions = [
    "Open full JSON in editor",
    "Rename profile",
    "Update description",
    `Toggle useDefaultModels (currently: ${existingProfile.useDefaultModels === false ? "false" : "true"})`,
    "Overwrite with current active router configuration",
  ];

  const chosenAction = await context.ui.select(
    `Edit Profile "${targetProfileName}":`,
    editActions,
  );
  if (!chosenAction) {
    return;
  }

  try {
    if (chosenAction === editActions[0]) {
      // Open JSON in editor
      const currentJson = JSON.stringify(existingProfile, null, 2);
      const editedJson = await context.ui.editor(
        `Edit Profile: ${targetProfileName}`,
        currentJson,
      );
      if (!editedJson) {
        context.ui.notify("Edit cancelled.", "info");
        return;
      }
      const updatedProfile = JSON.parse(editedJson) as JevProfile;
      await runtime.updateProfile(targetProfileName, updatedProfile);
      context.ui.notify(`Updated profile "${targetProfileName}".`, "info");
    } else if (chosenAction === editActions[1]) {
      // Rename profile
      const newNameInput = await context.ui.input(
        "Enter new name for profile:",
        targetProfileName,
      );
      if (!newNameInput || !newNameInput.trim() || newNameInput.trim() === targetProfileName) {
        return;
      }
      await runtime.renameProfile(targetProfileName, newNameInput.trim());
      context.ui.notify(
        `Renamed profile "${targetProfileName}" to "${newNameInput.trim()}".`,
        "info",
      );
    } else if (chosenAction === editActions[2]) {
      // Update description
      const newDescription = await context.ui.input(
        "Enter description for profile:",
        existingProfile.description ?? "",
      );
      if (newDescription === undefined) {
        return;
      }
      const updatedProfile: JevProfile = {
        ...existingProfile,
        description: newDescription.trim() || undefined,
      };
      await runtime.updateProfile(targetProfileName, updatedProfile);
      context.ui.notify(`Updated description for profile "${targetProfileName}".`, "info");
    } else if (chosenAction === editActions[3]) {
      // Toggle useDefaultModels
      const nextUseDefaults = existingProfile.useDefaultModels === false ? true : false;
      const updatedProfile: JevProfile = {
        ...existingProfile,
        useDefaultModels: nextUseDefaults,
      };
      await runtime.updateProfile(targetProfileName, updatedProfile);
      context.ui.notify(
        `Set useDefaultModels to ${nextUseDefaults} for profile "${targetProfileName}".`,
        "info",
      );
    } else if (chosenAction === editActions[4]) {
      // Overwrite with current active router configuration
      const activeConfig = await loadActiveRouterConfig(runtime.getRouterConfigPath());
      if (!activeConfig) {
        context.ui.notify(
          `No active router configuration found at ${runtime.getRouterConfigPath()}.`,
          "error",
        );
        return;
      }
      const shouldOverwrite = await context.ui.confirm(
        "Overwrite Profile",
        `Are you sure you want to overwrite profile "${targetProfileName}" with the active router configuration?`,
      );
      if (!shouldOverwrite) {
        return;
      }
      const updatedProfile: JevProfile = {
        ...activeConfig,
        description: existingProfile.description,
      };
      await runtime.updateProfile(targetProfileName, updatedProfile);
      context.ui.notify(
        `Overwrote profile "${targetProfileName}" with active router configuration.`,
        "info",
      );
    }
  } catch (error) {
    context.ui.notify(
      `Failed to edit profile: ${formatError(error)}`,
      "error",
    );
  }
}
