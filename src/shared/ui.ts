import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatProfileListItem } from "./format.js";

export const STATUS_BAR_KEY = "jev-profile";

export function updateStatusBar(
  uiContext: ExtensionUIContext | undefined,
  activeProfileName: string | undefined,
): void {
  if (!uiContext || typeof uiContext.setStatus !== "function") {
    return;
  }

  if (activeProfileName) {
    uiContext.setStatus(STATUS_BAR_KEY, `Jev: ${activeProfileName}`);
  } else {
    uiContext.setStatus(STATUS_BAR_KEY, undefined);
  }
}

export async function promptSelectProfile(
  uiContext: ExtensionUIContext,
  title: string,
  runtime: ProfileSwitcherRuntime,
): Promise<string | undefined> {
  const profileNames = runtime.getProfileNames();
  if (profileNames.length === 0) {
    uiContext.notify("No profiles found. Use /jev-profile-init or /jev-profile-add.", "warning");
    return undefined;
  }

  const activeProfileName = runtime.getActiveProfileName();
  const options = profileNames.map((name) => {
    const profile = runtime.getProfile(name);
    return profile
      ? formatProfileListItem(name, profile, name === activeProfileName)
      : name;
  });

  const selectedOption = await uiContext.select(title, options);
  if (!selectedOption) {
    return undefined;
  }

  const selectedIndex = options.indexOf(selectedOption);
  if (selectedIndex === -1) {
    return undefined;
  }

  return profileNames[selectedIndex];
}
