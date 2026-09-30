import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import {
  extractProvidersFromProfile,
  formatProfileDetailView,
} from "../shared/format.js";
import { promptSelectProfile } from "../shared/ui.js";
import { getProviderAccountStatuses } from "../storage/account-switcher.js";

export async function handleProfileShow(
  argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  let profileNameToInspect = argumentText.trim();
  if (!profileNameToInspect) {
    const selected = await promptSelectProfile(
      context.ui,
      "Select Jev Router Profile to View",
      runtime,
    );
    if (!selected) {
      return;
    }
    profileNameToInspect = selected;
  }

  const profile = runtime.getProfile(profileNameToInspect);
  if (!profile) {
    context.ui.notify(
      `Profile "${profileNameToInspect}" does not exist. Available profiles: ${runtime.getProfileNames().join(", ")}`,
      "error",
    );
    return;
  }

  const isActive = runtime.getActiveProfileName() === profileNameToInspect;
  const providers = extractProvidersFromProfile(profile);
  const accountStatuses = await getProviderAccountStatuses(providers);

  const formattedDetails = formatProfileDetailView(
    profileNameToInspect,
    profile,
    isActive,
    accountStatuses,
  );

  context.ui.notify(formattedDetails, "info");
}
