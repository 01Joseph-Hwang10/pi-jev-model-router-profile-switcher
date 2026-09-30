import { readFile } from "node:fs/promises";
import { isMissingFileError } from "../shared/errors.js";
import {
  getAccountSwitcherAccountsPath,
  getAccountSwitcherStatePath,
} from "./paths.js";

export interface AccountSwitcherAccountInfo {
  id: string;
  label: string;
  provider: string;
}

export interface ProviderAccountStatus {
  configuredAccounts: AccountSwitcherAccountInfo[];
  activeAccountId?: string;
  activeAccountLabel?: string;
}

export async function loadAccountSwitcherAccounts(
  accountsPath: string = getAccountSwitcherAccountsPath(),
): Promise<AccountSwitcherAccountInfo[]> {
  try {
    const rawContent = await readFile(accountsPath, "utf8");
    const parsed = JSON.parse(rawContent) as { accounts?: AccountSwitcherAccountInfo[] };
    if (Array.isArray(parsed?.accounts)) {
      return parsed.accounts;
    }
    return [];
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }
    return [];
  }
}

export async function loadAccountSwitcherSelected(
  statePath: string = getAccountSwitcherStatePath(),
): Promise<Record<string, string>> {
  try {
    const rawContent = await readFile(statePath, "utf8");
    const parsed = JSON.parse(rawContent) as { selected?: Record<string, string> };
    if (parsed?.selected && typeof parsed.selected === "object") {
      return parsed.selected;
    }
    return {};
  } catch (error) {
    if (isMissingFileError(error)) {
      return {};
    }
    return {};
  }
}

export async function getProviderAccountStatuses(
  providers: string[],
): Promise<Record<string, ProviderAccountStatus>> {
  const accounts = await loadAccountSwitcherAccounts();
  const selected = await loadAccountSwitcherSelected();

  const statuses: Record<string, ProviderAccountStatus> = {};

  for (const provider of providers) {
    const matchingAccounts = accounts.filter(
      (account) => account.provider.toLowerCase() === provider.toLowerCase(),
    );
    const activeAccountId = selected[provider.toLowerCase()];
    const activeAccount = matchingAccounts.find(
      (account) => account.id === activeAccountId,
    );

    statuses[provider] = {
      configuredAccounts: matchingAccounts,
      activeAccountId,
      activeAccountLabel: activeAccount?.label,
    };
  }

  return statuses;
}
