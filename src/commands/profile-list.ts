import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatProfileListItem } from "../shared/format.js";
import { handleProfileSwitch } from "./profile-switch.js";

export async function handleProfileList(
  _argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  const profileNames = runtime.getProfileNames();
  if (profileNames.length === 0) {
    context.ui.notify(
      "No profiles found. Use /jev-profile-init to create starter profiles or /jev-profile-add to add one.",
      "warning",
    );
    return;
  }

  const activeProfileName = runtime.getActiveProfileName();
  const options = profileNames.map((name) => {
    const profile = runtime.getProfile(name);
    return profile
      ? formatProfileListItem(name, profile, name === activeProfileName)
      : name;
  });

  const selectedOption = await context.ui.select(
    "Jev Router Profiles (Select to switch or Esc to close)",
    options,
  );

  if (!selectedOption) {
    return;
  }

  const selectedIndex = options.indexOf(selectedOption);
  if (selectedIndex !== -1) {
    const chosenProfileName = profileNames[selectedIndex];
    await handleProfileSwitch(chosenProfileName, runtime, context);
  }
}
