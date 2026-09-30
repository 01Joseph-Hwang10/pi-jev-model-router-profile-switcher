import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { JevProfile } from "../domain/types.js";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatError } from "../shared/errors.js";
import { promptSelectProfile } from "../shared/ui.js";
import { loadActiveRouterConfig } from "../storage/router-config.js";
import { handleProfileSwitch } from "./profile-switch.js";

export async function handleProfileAdd(
  argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  let targetProfileName = argumentText.trim();
  if (!targetProfileName) {
    const inputName = await context.ui.input(
      "Enter a name for the new profile:",
      "e.g. google-fast, custom-openrouter, anthropic-deepseek",
    );
    if (!inputName || !inputName.trim()) {
      return;
    }
    targetProfileName = inputName.trim();
  }

  if (runtime.getProfile(targetProfileName)) {
    context.ui.notify(
      `Profile "${targetProfileName}" already exists. Use a different name or edit the existing profile.`,
      "error",
    );
    return;
  }

  const creationOptions = [
    "Capture current active router configuration (pi-jev-model-router.json)",
    "Copy from an existing profile",
    "Open JSON editor to define profile from scratch",
  ];

  const selectedOption = await context.ui.select(
    `Create profile "${targetProfileName}" from:`,
    creationOptions,
  );
  if (!selectedOption) {
    return;
  }

  let newProfile: JevProfile | undefined;

  if (selectedOption === creationOptions[0]) {
    // Capture active router configuration
    const activeConfig = await loadActiveRouterConfig(runtime.getRouterConfigPath());
    if (!activeConfig) {
      context.ui.notify(
        `No active router configuration found at ${runtime.getRouterConfigPath()}.`,
        "error",
      );
      return;
    }
    const description = await context.ui.input(
      "Optional description for this profile:",
      "e.g. Current live router configuration snapshot",
    );
    newProfile = {
      ...(description?.trim() ? { description: description.trim() } : {}),
      ...activeConfig,
    };
  } else if (selectedOption === creationOptions[1]) {
    // Copy from existing profile
    const sourceProfileName = await promptSelectProfile(
      context.ui,
      "Select profile to copy from:",
      runtime,
    );
    if (!sourceProfileName) {
      return;
    }
    const sourceProfile = runtime.getProfile(sourceProfileName);
    if (!sourceProfile) {
      context.ui.notify(`Source profile "${sourceProfileName}" not found.`, "error");
      return;
    }
    const description = await context.ui.input(
      "Optional description for this profile:",
      sourceProfile.description ?? `Cloned from ${sourceProfileName}`,
    );
    newProfile = {
      ...structuredClone(sourceProfile),
      description: description?.trim() || sourceProfile.description,
    };
  } else {
    // Open in editor
    const templateProfile: JevProfile = {
      description: "Custom router profile",
      useDefaultModels: false,
      routes: {
        quick: [{ provider: "google", model: "gemini-3.5-flash-lite" }],
        standard: [{ provider: "google", model: "gemini-3.8-flash" }],
        high: [{ provider: "google", model: "gemini-3.8-flash" }],
        premium: [{ provider: "google", model: "gemini-3.8-flash" }],
      },
      kindModels: {},
    };

    const initialJson = JSON.stringify(templateProfile, null, 2);
    const editedJson = await context.ui.editor(
      `Edit New Profile: ${targetProfileName}`,
      initialJson,
    );
    if (!editedJson) {
      context.ui.notify("Profile creation cancelled.", "info");
      return;
    }

    try {
      newProfile = JSON.parse(editedJson) as JevProfile;
    } catch (parseError) {
      context.ui.notify(
        `Invalid JSON syntax: ${formatError(parseError)}. Profile was not created.`,
        "error",
      );
      return;
    }
  }

  if (!newProfile) {
    return;
  }

  try {
    await runtime.createProfile(targetProfileName, newProfile);
    context.ui.notify(
      `Successfully created profile "${targetProfileName}".`,
      "info",
    );

    const shouldSwitchNow = await context.ui.confirm(
      "Activate Profile",
      `Do you want to switch to "${targetProfileName}" right now?`,
    );

    if (shouldSwitchNow) {
      await handleProfileSwitch(targetProfileName, runtime, context);
      return;
    }
  } catch (error) {
    context.ui.notify(
      `Failed to create profile: ${formatError(error)}`,
      "error",
    );
  }
}
