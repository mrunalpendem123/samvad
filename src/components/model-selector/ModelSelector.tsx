import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { produce } from "immer";
import { commands, type ModelInfo } from "@/bindings";
import { useSettings } from "../../hooks/useSettings";
import DownloadProgressDisplay from "./DownloadProgressDisplay";

interface ModelStateEvent {
  event_type: string;
  model_id?: string;
  model_name?: string;
  error?: string;
}

interface DownloadProgress {
  model_id: string;
  downloaded: number;
  total: number;
  percentage: number;
}

type ModelStatus =
  | "ready"
  | "loading"
  | "downloading"
  | "extracting"
  | "error"
  | "unloaded"
  | "none";

interface DownloadStats {
  startTime: number;
  lastUpdate: number;
  totalDownloaded: number;
  speed: number;
}

interface ModelSelectorProps {
  onError?: (error: string) => void;
}

const OFFLINE_MODEL_ID = "nvidia/nemotron-speech-streaming-en-0.6b";
const ONLINE_MODEL_ID = "sarvam-speech-to-text";

const ModelSelector: React.FC<ModelSelectorProps> = ({ onError }) => {
  const { t } = useTranslation();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string>("");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("unloaded");
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelDownloadProgress, setModelDownloadProgress] = useState<
    Record<string, DownloadProgress>
  >({});
  const [downloadStats, setDownloadStats] = useState<
    Record<string, DownloadStats>
  >({});
  const [extractingModels, setExtractingModels] = useState<
    Record<string, true>
  >({});
  const { getSetting } = useSettings();
  const sarvamApiKey = (getSetting("sarvam_api_key") ?? "").trim();

  const isOnline = currentModelId === ONLINE_MODEL_ID;

  useEffect(() => {
    loadModels();
    loadCurrentModel();

    // Listen for model state changes
    const modelStateUnlisten = listen<ModelStateEvent>(
      "model-state-changed",
      (event) => {
        const { event_type, model_id, error } = event.payload;

        switch (event_type) {
          case "loading_started":
            setModelStatus("loading");
            setModelError(null);
            break;
          case "loading_completed":
            setModelStatus("ready");
            setModelError(null);
            if (model_id) setCurrentModelId(model_id);
            break;
          case "loading_failed":
            setModelStatus("error");
            setModelError(error || "Failed to load model");
            break;
          case "unloaded":
            setModelStatus("unloaded");
            setModelError(null);
            break;
        }
      },
    );

    // Listen for model download progress
    const downloadProgressUnlisten = listen<DownloadProgress>(
      "model-download-progress",
      (event) => {
        const progress = event.payload;
        setModelDownloadProgress(
          produce((downloadProgress) => {
            downloadProgress[progress.model_id] = progress;
          }),
        );
        setModelStatus("downloading");

        // Update download stats for speed calculation
        const now = Date.now();
        setDownloadStats(
          produce((stats) => {
            const current = stats[progress.model_id];

            if (!current) {
              // First progress update - initialize
              stats[progress.model_id] = {
                startTime: now,
                lastUpdate: now,
                totalDownloaded: progress.downloaded,
                speed: 0,
              };
            } else {
              // Calculate speed over last few seconds
              const timeDiff = (now - current.lastUpdate) / 1000; // seconds
              const bytesDiff = progress.downloaded - current.totalDownloaded;

              if (timeDiff > 0.5) {
                // Update speed every 500ms
                const currentSpeed = bytesDiff / (1024 * 1024) / timeDiff; // MB/s
                // Smooth the speed with exponential moving average, but ensure positive values
                const validCurrentSpeed = Math.max(0, currentSpeed);
                const smoothedSpeed =
                  current.speed > 0
                    ? current.speed * 0.8 + validCurrentSpeed * 0.2
                    : validCurrentSpeed;

                stats[progress.model_id] = {
                  startTime: current.startTime,
                  lastUpdate: now,
                  totalDownloaded: progress.downloaded,
                  speed: Math.max(0, smoothedSpeed),
                };
              }
            }
          }),
        );
      },
    );

    // Listen for model download completion
    const downloadCompleteUnlisten = listen<string>(
      "model-download-complete",
      (event) => {
        const modelId = event.payload;
        setModelDownloadProgress(
          produce((progress) => {
            delete progress[modelId];
          }),
        );
        setDownloadStats(
          produce((stats) => {
            delete stats[modelId];
          }),
        );
        loadModels(); // Refresh models list

        // Auto-select the newly downloaded model (skip if recording in progress)
        setTimeout(async () => {
          const isRecording = await commands.isRecording();
          if (isRecording) {
            return; // Skip auto-switch if recording in progress
          }
          loadCurrentModel();
          handleModelSwitch(modelId);
        }, 500);
      },
    );

    // Listen for extraction events
    const extractionStartedUnlisten = listen<string>(
      "model-extraction-started",
      (event) => {
        const modelId = event.payload;
        setExtractingModels(
          produce((extracting) => {
            extracting[modelId] = true;
          }),
        );
        setModelStatus("extracting");
      },
    );

    const extractionCompletedUnlisten = listen<string>(
      "model-extraction-completed",
      (event) => {
        const modelId = event.payload;
        setExtractingModels(
          produce((extracting) => {
            delete extracting[modelId];
          }),
        );
        loadModels(); // Refresh models list

        // Auto-select the newly extracted model (skip if recording in progress)
        setTimeout(async () => {
          const isRecording = await commands.isRecording();
          if (isRecording) {
            return; // Skip auto-switch if recording in progress
          }
          loadCurrentModel();
          handleModelSwitch(modelId);
        }, 500);
      },
    );

    const extractionFailedUnlisten = listen<{
      model_id: string;
      error: string;
    }>("model-extraction-failed", (event) => {
      const modelId = event.payload.model_id;
      setExtractingModels(
        produce((extracting) => {
          delete extracting[modelId];
        }),
      );
      setModelError(`Failed to extract model: ${event.payload.error}`);
      setModelStatus("error");
    });

    return () => {
      modelStateUnlisten.then((fn) => fn());
      downloadProgressUnlisten.then((fn) => fn());
      downloadCompleteUnlisten.then((fn) => fn());
      extractionStartedUnlisten.then((fn) => fn());
      extractionCompletedUnlisten.then((fn) => fn());
      extractionFailedUnlisten.then((fn) => fn());
    };
  }, []);

  const loadModels = async () => {
    try {
      const result = await commands.getAvailableModels();
      if (result.status === "ok") {
        setModels(result.data);
      }
    } catch (err) {
      console.error("Failed to load models:", err);
    }
  };

  const loadCurrentModel = async () => {
    try {
      const result = await commands.getCurrentModel();
      if (result.status === "ok") {
        const current = result.data;
        setCurrentModelId(current);

        if (current) {
          // Check if model is actually loaded
          const statusResult = await commands.getTranscriptionModelStatus();
          if (statusResult.status === "ok") {
            const transcriptionStatus = statusResult.data;
            if (transcriptionStatus === current) {
              setModelStatus("ready");
            } else {
              setModelStatus("unloaded");
            }
          }
        } else {
          setModelStatus("none");
        }
      }
    } catch (err) {
      console.error("Failed to load current model:", err);
      setModelStatus("error");
      setModelError("Failed to check model status");
    }
  };

  const handleModelSwitch = async (targetModelId: string) => {
    try {
      if (targetModelId === ONLINE_MODEL_ID && !sarvamApiKey) {
        const errorMsg = t(
          "settings.general.sarvamApiKey.errors.missing",
          "Sarvam API key is missing. Add it in Settings > General.",
        );
        setModelError(errorMsg);
        setModelStatus("error");
        onError?.(errorMsg);
        return;
      }

      setCurrentModelId(targetModelId); // Optimistic update
      setModelError(null);

      const result = await commands.setActiveModel(targetModelId);
      if (result.status === "error") {
        const errorMsg = result.error;
        setModelError(errorMsg);
        setModelStatus("error");
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = `${err}`;
      setModelError(errorMsg);
      setModelStatus("error");
      onError?.(errorMsg);
    }
  };

  const handleToggle = async () => {
    const targetModelId = isOnline ? OFFLINE_MODEL_ID : ONLINE_MODEL_ID;

    // Check if offline model needs download
    if (targetModelId === OFFLINE_MODEL_ID) {
      const offlineModel = models.find(m => m.id === OFFLINE_MODEL_ID);
      if (offlineModel && !offlineModel.is_downloaded && !offlineModel.is_downloading) {
        // Need to download first
        try {
          const result = await commands.downloadModel(OFFLINE_MODEL_ID);
          if (result.status === "error") {
            setModelError(result.error);
            return;
          }
          // Download started, listener will handle the rest
          return;
        } catch (e) {
          setModelError(`${e}`);
          return;
        }
      }
    }

    handleModelSwitch(targetModelId);
  };

  const getStatusText = () => {
    if (extractingModels[OFFLINE_MODEL_ID]) return "Extracting...";
    if (modelDownloadProgress[OFFLINE_MODEL_ID]) {
      const p = modelDownloadProgress[OFFLINE_MODEL_ID];
      return `Downloading: ${Math.round(p.percentage)}%`;
    }
    if (modelStatus === "loading") return "Loading...";
    if (modelStatus === "error") return "Error";
    if (modelStatus === "ready") return "Ready";
    return "";
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        className="flex items-center justify-between bg-mid-gray/5 p-1 rounded-lg border border-mid-gray/10 cursor-pointer"
        onClick={handleToggle}
      >
        <span className={`text-xs font-medium px-2 ${!isOnline ? "text-text" : "text-text/40"}`}>Offline</span>

        {/* Toggle Switch Visual */}
        <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${isOnline ? "bg-logo-primary" : "bg-mid-gray/40"}`}>
          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${isOnline ? "translate-x-4" : "translate-x-0"}`} />
        </div>

        <span className={`text-xs font-medium px-2 ${isOnline ? "text-text" : "text-text/40"}`}>Online</span>
      </div>

      {/* Status Text / Error */}
      {(modelStatus !== "ready" || modelError) && (
        <div className="text-[10px] text-center text-text/60 h-3">
          {modelError ? <span className="text-red-400">{modelError}</span> : getStatusText()}
        </div>
      )}

      {/* Download Progress Bar (if active) */}
      <DownloadProgressDisplay
        downloadProgress={modelDownloadProgress}
        downloadStats={downloadStats}
      />
    </div>
  );
};

export default ModelSelector;
