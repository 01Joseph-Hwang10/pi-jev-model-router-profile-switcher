# pi-jev-model-router-profile-switcher

A [Pi](https://pi.dev) package and extension for managing and seamlessly switching between multiple dynamic LLM routing profiles for [`pi-jev-model-router`](https://pi.dev/packages/pi-jev-model-router).

Inspired by [`pi-account-switcher`](https://pi.dev/packages/pi-account-switcher) and designed to work hand-in-hand with it and `pi-jev-model-router`.

---

## The Workflow Trio

1. **[`pi-jev-model-router`](https://pi.dev/packages/pi-jev-model-router)**: Classifies tasks using TypeSafe Jev and routes prompts to cost/performance tiers (`quick`, `standard`, `high`, `premium`).
2. **`pi-jev-model-router-profile-switcher` (this package)**: Manages and swaps whole routing strategies on the fly (e.g. `google` direct, `openrouter` multi-provider, `zai` GLM specialists, `budget-saver`, `deep-coding`).
3. **[`pi-account-switcher`](https://pi.dev/packages/pi-account-switcher)**: Manages and switches API keys and accounts per provider (e.g. Work vs Personal Google/OpenAI accounts).

---

## Features

- **Profile Switching**: Instantly switch between profiles with `/jev-profile <name>` or an interactive fuzzy selector `/jev-profiles`.
- **Full CRUD Capabilities**:
  - **Create**: Add a new profile interactively, copy an existing profile, or draft in Pi's built-in multi-line JSON editor (`/jev-profile-add`).
  - **Save Live Config**: Snapshot your current live `pi-jev-model-router.json` as a named profile (`/jev-profile-save`).
  - **Read**: List profiles with active status and provider badges (`/jev-profiles`, `/jev-profile list`), view active profile (`/jev-profile-current`), or inspect full route chains (`/jev-profile-show`).
  - **Update**: Edit in JSON editor, rename, update description, or toggle `useDefaultModels` fallback (`/jev-profile-edit`).
  - **Delete**: Permanently remove profiles with confirmation guards (`/jev-profile-remove`).
  - **Clone**: Duplicate profiles quickly (`/jev-profile-clone`).
- **Seamless Live Reload**: Automatically updates `pi-jev-model-router.json` and triggers runtime reload so new routing rules apply immediately without restarting Pi.
- **Status Bar Integration**: Keeps the active profile name visible in Pi's status bar (`Jev: google`).
- **`pi-account-switcher` Awareness**: Reports account configuration status for the providers used in your active profile.

---

## Installation

### From npm

```bash
pi install npm:pi-jev-model-router-profile-switcher
```

Or install project-locally (saves to `.pi/settings.json`):

```bash
pi install -l npm:pi-jev-model-router-profile-switcher
```

To test without permanently installing:

```bash
pi -e npm:pi-jev-model-router-profile-switcher
```

### From GitHub

```bash
pi install git:github.com/01Joseph-Hwang10/pi-jev-model-router-profile-switcher
```

---

## Commands

| Command | Description |
|---|---|
| `/jev-profile` | Interactive menu to switch, list, add, edit, or manage profiles |
| `/jev-profile <name>` | Switch directly to `<name>` profile |
| `/jev-profiles` | Interactive fuzzy list & picker to switch profiles |
| `/jev-profile-current` | Show details, routes, and account status of the active profile |
| `/jev-profile-show [name]` | Inspect full tier routes, kind specialists, and budget for a profile |
| `/jev-profile-add [name]` | Create a new profile interactively or from JSON editor |
| `/jev-profile-save [name]` | Capture and save current live `pi-jev-model-router.json` as a profile |
| `/jev-profile-edit [name]` | Open JSON editor, rename, or update an existing profile |
| `/jev-profile-clone <s> <t>` | Duplicate an existing profile |
| `/jev-profile-remove [name]`| Delete a profile |
| `/jev-profile-init` | Generate starter example profiles file if missing |
| `/jev-profile-reload` | Reload profiles from disk |

All commands support tab completion for profile names and subcommands.

---

## Configuration

Profiles are stored in:
- **Global**: `~/.pi/agent/pi-jev-model-router-profiles.json`
- **Project**: `.pi/pi-jev-model-router-profiles.json` (when running inside a project)

When you switch profiles, the active configuration is written directly to:
- `~/.pi/agent/pi-jev-model-router.json`

### Example `pi-jev-model-router-profiles.json`

```json
{
  "google": {
    "description": "Google Gemini direct models",
    "useDefaultModels": false,
    "routes": {
      "quick": [{ "provider": "google", "model": "gemini-3.5-flash-lite" }],
      "standard": [{ "provider": "google", "model": "gemini-3.8-flash" }],
      "high": [{ "provider": "google", "model": "gemini-3.8-flash" }],
      "premium": [{ "provider": "google", "model": "gemini-3.8-flash" }]
    },
    "kindModels": {
      "plan": [{ "provider": "google", "model": "gemini-3.8-flash", "minTier": "high" }],
      "implement": [{ "provider": "google", "model": "gemini-3.8-flash", "minTier": "standard" }],
      "debug": [{ "provider": "google", "model": "gemini-3.8-flash", "minTier": "standard" }],
      "review": [{ "provider": "google", "model": "gemini-3.8-flash", "minTier": "high" }],
      "explain": [{ "provider": "google", "model": "gemini-3.5-flash-lite", "minTier": "quick" }],
      "chat": [{ "provider": "google", "model": "gemini-3.5-flash-lite", "minTier": "quick" }]
    }
  },
  "openrouter": {
    "description": "OpenRouter multi-provider model chain",
    "useDefaultModels": true,
    "routes": {
      "quick": [
        { "provider": "openrouter", "model": "~google/gemini-flash-latest" },
        { "provider": "openrouter", "model": "~openai/gpt-luna-latest" }
      ],
      "standard": [
        { "provider": "openrouter", "model": "~deepseek/deepseek-pro-latest" },
        { "provider": "openrouter", "model": "openai/gpt-5.4-mini" }
      ],
      "high": [
        { "provider": "openrouter", "model": "~anthropic/claude-sonnet-latest" },
        { "provider": "openrouter", "model": "~openai/gpt-terra-latest" }
      ],
      "premium": [
        { "provider": "openrouter", "model": "~anthropic/claude-opus-latest" },
        { "provider": "openrouter", "model": "openai/gpt-5.5" }
      ]
    }
  },
  "zai": {
    "description": "Z.ai GLM reasoning models",
    "useDefaultModels": false,
    "routes": {
      "quick": [{ "provider": "zai", "model": "glm-5.3-flash" }],
      "standard": [{ "provider": "zai", "model": "glm-5.3" }],
      "high": [{ "provider": "zai", "model": "glm-5.3" }],
      "premium": [{ "provider": "zai", "model": "glm-5.3" }]
    }
  }
}
```

---

## License

MIT © [Joseph Hwang](https://github.com/01Joseph-Hwang10)
