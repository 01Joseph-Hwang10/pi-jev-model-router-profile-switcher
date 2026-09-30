import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { ProfileSwitcherRuntime } from "../runtime/profile-switcher.js";
import { formatError } from "../shared/errors.js";
import { promptSelectProfile, updateStatusBar } from "../shared/ui.js";
import { getProviderAccountStatuses } from "../storage/account-switcher.js";

export async function handleProfileSwitch(
  argumentText: string,
  runtime: ProfileSwitcherRuntime,
  context: ExtensionCommandContext,
): Promise<void> {
  await runtime.reload();

  const requestedName = argumentText.trim();
  let targetProfileName: string | undefined = requestedName;

  if (!targetProfileName) {
    targetProfileName = await promptSelectProfile(
      context.ui,
      "Select Jev Router Profile to Activate",
      runtime,
    );
    if (!targetProfileName) {
      return;
    }
  }

  try {
    const reloadFunction =
      typeof context.reload === "function" ? async () => context.reload() : undefined;

    const result = await runtime.switchProfile(targetProfileName, reloadFunction);
    updateStatusBar(context.ui, result.currentProfileName);

    const message = `Switched Jev router profile to "${result.currentProfileName}". Active configuration written to ${result.routerConfigurationPath}.${result.reloaded ? " Runtime reloaded." : ""}`;
    context.ui.notify(message, "info");

    // Optional advisory for pi-account-switcher accounts
    if (result.providers.length > 0) {
      const accountStatuses = await getProviderAccountStatuses(result.providers);
      const warnings: string[] = [];
      for (const [provider, status] of Object.entries(accountStatuses)) {
        if (
          status.configuredAccounts.length > 0 &&
          !status.activeAccountId
        ) {
          warnings.push(
            `Provider "${provider}" has accounts configured in pi-account-switcher but none is currently selected. Use /account ${provider} to choose one.`,
          );
        }
      }
      if (warnings.length > 0) {
        context.ui.notify(warnings.join("\n"), "warning");
      }
    }
  } catch (error) {
    context.ui.notify(
      `Failed to switch profile: ${formatError(error)}`,
      "error",
    );
  }
}
