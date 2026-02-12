# Samvad

Samvad is a cross-platform speech-to-text desktop app built with Tauri (Rust + React/TypeScript). It supports fast offline transcription and an optional online mode for Indic languages.

## Features

- Offline speech-to-text with local models
- Online mode for Indic languages (Sarvam AI)
- Global hotkeys and push-to-talk
- Real-time overlay and history
- Post-processing via LLM providers (optional)

## Development

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

### Frontend only

```bash
bun run dev
```

## Models

Create the models directory and download the VAD model:

```bash
mkdir -p src-tauri/resources/models
curl -o src-tauri/resources/models/silero_vad_v4.onnx https://blob.handy.computer/silero_vad_v4.onnx
```

## License

MIT
