import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import {
  extractProvidersFromProfile,
  formatProfileDetailView,
} from "../shared/format.js";
import { getProviderAccountStatuses } from "../storage/account-switcher.js";

export async function handleProfileCurrent(
  _argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  const activeProfileName = runtime.getActiveProfileName();
  if (!activeProfileName) {
    context.ui.notify(
      "No Jev router profile is currently active. Use /jev-profile or /jev-profiles to select one.",
      "warning",
    );
    return;
  }

  const profile = runtime.getProfile(activeProfileName);
  if (!profile) {
    context.ui.notify(
      `Active profile "${activeProfileName}" was not found in profiles collection.`,
      "error",
    );
    return;
  }

  const providers = extractProvidersFromProfile(profile);
  const accountStatuses = await getProviderAccountStatuses(providers);

  const formattedDetails = formatProfileDetailView(
    activeProfileName,
    profile,
    true,
    accountStatuses,
  );

  context.ui.notify(formattedDetails, "info");
}
