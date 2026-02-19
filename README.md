# Samvad

Samvad is a cross-platform speech-to-text desktop app built with Tauri (Rust + React/TypeScript). It supports fast offline transcription and an optional online mode for Indic languages. The app runs locally, uses global shortcuts, and pastes text directly into the active app.

## Highlights

- Offline speech-to-text with local models
- Online mode for Indic languages (Sarvam AI)
- Global hotkeys and push-to-talk
- Real-time overlay and transcription history
- Optional post-processing with LLM providers

## Screenshots

Add screenshots in `./docs/` and update this section as needed.

## Tech Stack

- Tauri (Rust backend + React/TypeScript frontend)
- Vite + Tailwind
- Local inference engines (Whisper/Parakeet/Moonshine as available)
- Optional cloud providers (Sarvam AI, OpenAI-compatible post-processing)

## Quick Start

### Prerequisites

- Rust (latest stable)
- Bun

### Install

```bash
bun install
```

### Run (Tauri)

```bash
bun run tauri dev
```

### First-Run Checklist

- Allow microphone access when prompted.
- macOS: grant Accessibility permission for global shortcuts.
- Open Settings → Models and download/select a local model.
- Default shortcut: `alt+space` (macOS) or `ctrl+space` (Windows/Linux).
- Optional: enable Online Mode and set your Sarvam API key.

### Frontend Only

```bash
bun run dev
```

## Models

No manual model downloads are required.

## Online Mode (Sarvam AI)

Online transcription for Indic languages uses the Sarvam AI API.

1. Open Settings → General.
2. Set the Sarvam API key.
3. Switch the model to Online mode.

You can also set the key via environment variable before first run:

```bash
export SARVAM_API_KEY="your_key_here"
```

## Post-Processing (Optional)

Samvad can post-process transcriptions using LLM providers (OpenAI-compatible APIs, Groq, Anthropic, etc.).

1. Enable post-processing in Settings.
2. Select a provider.
3. Add your API key.
4. Choose a model and prompt.

## Project Structure

- `src/` React frontend
- `src-tauri/` Rust backend
- `src-tauri/src/managers/` Core logic (audio, model, transcription)
- `src-tauri/src/shortcut/` Global shortcut implementations
- `src-tauri/resources/` Bundled assets and models

## Build

```bash
bun run tauri build
```

## Troubleshooting

### Online Mode Fails

- Confirm the Sarvam API key is set.
- Check the app logs for the error message.

### Global Shortcuts Not Working (macOS)

- Grant Accessibility permission in System Settings.
- Restart the app after granting permissions.

## License

MIT
