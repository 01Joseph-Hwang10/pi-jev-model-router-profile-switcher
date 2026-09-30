# Usage Guide

This guide walks through using `pi-jev-model-router-profile-switcher` with `pi-jev-model-router` and `pi-account-switcher`.

---

## 1. Quick Start

Ensure you have your profiles file initialized:

```txt
/jev-profile-init
```

List and pick a profile:

```txt
/jev-profiles
```

Or switch directly:

```txt
/jev-profile google
```

Check the active profile:

```txt
/jev-profile-current
```

---

## 2. Capturing Your Current Configuration as a Profile

If you currently have a customized `~/.pi/agent/pi-jev-model-router.json` and want to save it as a named profile:

```txt
/jev-profile-save my-tuned-setup
```

You will be prompted for an optional description, and the current active setup will be saved to `~/.pi/agent/pi-jev-model-router-profiles.json`.

---

## 3. Creating a Profile Interactively

Run:

```txt
/jev-profile-add
```

You can choose between:
- Capturing the current active configuration
- Copying from an existing profile
- Opening Pi's built-in multi-line JSON editor to write the configuration directly

---

## 4. Editing a Profile

Run:

```txt
/jev-profile-edit
```

Select the profile you wish to modify. You can:
- Open the full profile JSON in Pi's editor
- Rename the profile
- Update the description
- Toggle `useDefaultModels` fallback
- Overwrite it with the currently active router configuration

---

## 5. Pairing with `pi-account-switcher`

When `pi-jev-model-router` routes a turn to a model (e.g. `google/gemini-3.8-flash`), Pi uses the active credentials for that provider.

With `pi-account-switcher`, you can manage multiple accounts for each provider:

```txt
/account google
```

When you view `/jev-profile-current` or `/jev-profile-show`, the switcher checks whether you have configured accounts in `pi-account-switcher` for the providers used by that profile and displays their status:

```txt
Profile: google [ACTIVE]
Providers used: google

Account Switcher Status:
  google: 2 account(s) available (✓ Active: Google — Personal)
```

If a provider has accounts configured but none is currently selected, a warning will advise running `/account <provider>` to select one.
