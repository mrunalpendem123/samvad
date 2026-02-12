import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { listen } from "@tauri-apps/api/event";
import { commands, type ModelInfo } from "@/bindings";

interface DownloadProgress {
  model_id: string;
  downloaded: number;
  total: number;
  percentage: number;
}

interface ModelStore {
  models: ModelInfo[];
  currentModel: string;
  downloadingModels: Set<string>;
  extractingModels: Set<string>;
  downloadProgress: Map<string, DownloadProgress>;
  loading: boolean;
  error: string | null;
  hasAnyModels: boolean;
  isFirstRun: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadModels: () => Promise<void>;
  loadCurrentModel: () => Promise<void>;
  checkFirstRun: () => Promise<boolean>;
  selectModel: (modelId: string) => Promise<boolean>;
  downloadModel: (modelId: string) => Promise<boolean>;
  deleteModel: (modelId: string) => Promise<boolean>;

  // Getters
  getModelInfo: (modelId: string) => ModelInfo | undefined;
  isModelDownloading: (modelId: string) => boolean;
  isModelExtracting: (modelId: string) => boolean;
  getDownloadProgress: (modelId: string) => DownloadProgress | undefined;

  isModelLoaded: boolean;
  checkModelLoadStatus: () => Promise<void>;

  // Internal setters
  setModels: (models: ModelInfo[]) => void;
  setCurrentModel: (model: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasAnyModels: (hasAny: boolean) => void;
  setIsFirstRun: (isFirst: boolean) => void;
  addDownloadingModel: (modelId: string) => void;
  removeDownloadingModel: (modelId: string) => void;
  addExtractingModel: (modelId: string) => void;
  removeExtractingModel: (modelId: string) => void;
  setDownloadProgress: (modelId: string, progress: DownloadProgress) => void;
  removeDownloadProgress: (modelId: string) => void;
}

export const useModelStore = create<ModelStore>()(
  subscribeWithSelector((set, get) => ({
    models: [],
    currentModel: "",
    downloadingModels: new Set(),
    extractingModels: new Set(),
    downloadProgress: new Map(),
    loading: true,
    error: null,
    hasAnyModels: false,
    isFirstRun: false,

    // Internal setters
    setModels: (models) => set({ models }),
    setCurrentModel: (currentModel) => set({ currentModel }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setHasAnyModels: (hasAnyModels) => set({ hasAnyModels }),
    setIsFirstRun: (isFirstRun) => set({ isFirstRun }),
    addDownloadingModel: (modelId) =>
      set((state) => ({
        downloadingModels: new Set(state.downloadingModels).add(modelId),
      })),
    removeDownloadingModel: (modelId) =>
      set((state) => {
        const next = new Set(state.downloadingModels);
        next.delete(modelId);
        return { downloadingModels: next };
      }),
    addExtractingModel: (modelId) =>
      set((state) => ({
        extractingModels: new Set(state.extractingModels).add(modelId),
      })),
    removeExtractingModel: (modelId) =>
      set((state) => {
        const next = new Set(state.extractingModels);
        next.delete(modelId);
        return { extractingModels: next };
      }),
    setDownloadProgress: (modelId, progress) =>
      set((state) => ({
        downloadProgress: new Map(state.downloadProgress).set(
          modelId,
          progress,
        ),
      })),
    removeDownloadProgress: (modelId) =>
      set((state) => {
        const next = new Map(state.downloadProgress);
        next.delete(modelId);
        return { downloadProgress: next };
      }),

    // Getters
    getModelInfo: (modelId) =>
      get().models.find((model) => model.id === modelId),
    isModelDownloading: (modelId) => get().downloadingModels.has(modelId),
    isModelExtracting: (modelId) => get().extractingModels.has(modelId),
    getDownloadProgress: (modelId) => get().downloadProgress.get(modelId),

    // State for memory load
    isModelLoaded: false,

    // Actions
    checkModelLoadStatus: async () => {
      try {
        const result = await commands.getModelLoadStatus();
        if (result.status === "ok") {
          set({
            isModelLoaded: result.data.is_loaded,
            // also update current model if it's reported
            ...(result.data.current_model ? { currentModel: result.data.current_model } : {})
          });
        }
      } catch (err) {
        console.error("Failed to check model load status:", err);
      }
    },

    loadModels: async () => {
      try {
        const result = await commands.getAvailableModels();
        if (result.status === "ok") {
          set({ models: result.data, error: null });
        } else {
          set({ error: `Failed to load models: ${result.error}` });
        }
      } catch (err) {
        set({ error: `Failed to load models: ${err}` });
      } finally {
        set({ loading: false });
      }
    },

    loadCurrentModel: async () => {
      try {
        const result = await commands.getCurrentModel();
        if (result.status === "ok") {
          set({ currentModel: result.data });
        }
      } catch (err) {
        console.error("Failed to load current model:", err);
      }
    },

    checkFirstRun: async () => {
      try {
        const result = await commands.hasAnyModelsAvailable();
        if (result.status === "ok") {
          const hasModels = result.data;
          set({ hasAnyModels: hasModels, isFirstRun: !hasModels });
          return !hasModels;
        }
        return false;
      } catch (err) {
        console.error("Failed to check model availability:", err);
        return false;
      }
    },

    selectModel: async (modelId) => {
      try {
        set({ error: null });
        const result = await commands.setActiveModel(modelId);
        if (result.status === "ok") {
          set({ currentModel: modelId, isFirstRun: false, hasAnyModels: true });
          // Check load status after switch, though it might take a moment to load
          get().checkModelLoadStatus();
          return true;
        } else {
          set({ error: `Failed to switch to model: ${result.error}` });
          return false;
        }
      } catch (err) {
        set({ error: `Failed to switch to model: ${err}` });
        return false;
      }
    },

    downloadModel: async (modelId) => {
      const { addDownloadingModel, removeDownloadingModel } = get();
      try {
        set({ error: null });
        addDownloadingModel(modelId);
        const result = await commands.downloadModel(modelId);
        if (result.status === "ok") {
          return true;
        } else {
          set({ error: `Failed to download model: ${result.error}` });
          removeDownloadingModel(modelId);
          return false;
        }
      } catch (err) {
        set({ error: `Failed to download model: ${err}` });
        removeDownloadingModel(modelId);
        return false;
      }
    },

    deleteModel: async (modelId) => {
      const { loadModels, checkModelLoadStatus } = get();
      try {
        set({ error: null });
        const result = await commands.deleteModel(modelId);
        if (result.status === "ok") {
          await loadModels();
          await checkModelLoadStatus();
          return true;
        } else {
          set({ error: `Failed to delete model: ${result.error}` });
          return false;
        }
      } catch (err) {
        set({ error: `Failed to delete model: ${err}` });
        return false;
      }
    },

    initialize: async () => {
      const { loadModels, loadCurrentModel, checkFirstRun, checkModelLoadStatus } = get();
      await Promise.all([
        loadModels(),
        loadCurrentModel(),
        checkFirstRun(),
        checkModelLoadStatus()
      ]);
    },
  })),
);

// Set up event listeners at module load
listen("model-state-changed", (event: any) => {
  // payload is ModelStateEvent { event_type: string, model_id: string|null, ... }
  const state = useModelStore.getState();
  const payload = event.payload;

  if (payload.event_type === "loading_completed") {
    state.checkModelLoadStatus(); // Re-sync truth from backend
    useModelStore.setState({ isModelLoaded: true });
  } else if (payload.event_type === "unloaded") {
    useModelStore.setState({ isModelLoaded: false });
  } else if (payload.event_type === "loading_failed") {
    state.setError(payload.error || "Model failed to load");
    useModelStore.setState({ isModelLoaded: false });
  }

  // Always refresh current model ref
  state.loadCurrentModel();
});

listen<DownloadProgress>("model-download-progress", (event) => {
  useModelStore
    .getState()
    .setDownloadProgress(event.payload.model_id, event.payload);
});

listen<string>("model-download-complete", (event) => {
  const modelId = event.payload;
  const state = useModelStore.getState();
  state.removeDownloadingModel(modelId);
  state.removeDownloadProgress(modelId);
  state.loadModels();
});

listen<string>("model-extraction-started", (event) => {
  useModelStore.getState().addExtractingModel(event.payload);
});

listen<string>("model-extraction-completed", (event) => {
  const state = useModelStore.getState();
  state.removeExtractingModel(event.payload);
  state.loadModels();
});

listen<{ model_id: string; error: string }>(
  "model-extraction-failed",
  (event) => {
    const state = useModelStore.getState();
    state.removeExtractingModel(event.payload.model_id);
    state.setError(`Failed to extract model: ${event.payload.error}`);
  },
);
