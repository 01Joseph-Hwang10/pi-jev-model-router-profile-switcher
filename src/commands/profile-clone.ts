import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatError } from "../shared/errors.js";
import { promptSelectProfile } from "../shared/ui.js";

export async function handleProfileClone(
  argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  const parts = argumentText.trim().split(/\s+/).filter(Boolean);
  let sourceProfileName = parts[0];
  let targetProfileName = parts[1];

  if (!sourceProfileName) {
    const selected = await promptSelectProfile(
      context.ui,
      "Select Jev Router Profile to Clone",
      runtime,
    );
    if (!selected) {
      return;
    }
    sourceProfileName = selected;
  }

  if (!targetProfileName) {
    const inputName = await context.ui.input(
      `Enter new name for cloned profile (copying from "${sourceProfileName}"):`,
      `${sourceProfileName}-copy`,
    );
    if (!inputName || !inputName.trim()) {
      return;
    }
    targetProfileName = inputName.trim();
  }

  try {
    await runtime.cloneProfile(sourceProfileName, targetProfileName);
    context.ui.notify(
      `Successfully cloned profile "${sourceProfileName}" to "${targetProfileName}".`,
      "info",
    );
  } catch (error) {
    context.ui.notify(
      `Failed to clone profile: ${formatError(error)}`,
      "error",
    );
  }
}
