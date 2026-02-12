import React from "react";
import { useModelStore } from "../stores/modelStore";
import { Loader2, CheckCircle2, Download, AlertCircle } from "lucide-react";

export const ModelStatusIndicator: React.FC = () => {
    const currentModel = useModelStore((state) => state.currentModel);
    const models = useModelStore((state) => state.models);
    const loading = useModelStore((state) => state.loading);
    const downloadingModels = useModelStore((state) => state.downloadingModels);
    const extractingModels = useModelStore((state) => state.extractingModels);
    const downloadProgress = useModelStore((state) => state.downloadProgress);
    const error = useModelStore((state) => state.error);
    // @ts-ignore
    const isModelLoaded = useModelStore((state) => (state as any).isModelLoaded);

    // Derive status
    const currentModelInfo = models.find((m) => m.id === currentModel);
    const isDownloading = currentModel && downloadingModels.has(currentModel);
    const isExtracting = currentModel && extractingModels.has(currentModel);
    const progress = currentModel ? downloadProgress.get(currentModel) : undefined;

    if (!currentModel && !loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-mid-gray bg-white/5 rounded-lg border border-white/5 transition-all">
                <AlertCircle size={14} className="text-orange-400" />
                <span>No Model Selected</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 transition-all max-w-[220px] truncate" title={error}>
                <AlertCircle size={14} className="shrink-0" />
                <span className="truncate">{error}</span>
            </div>
        );
    }

    if (isDownloading) {
        return (
            <div className="flex flex-col gap-1.5 px-3 py-2 text-xs text-accent bg-accent/10 rounded-lg border border-accent/20 transition-all">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Download size={14} className="animate-pulse" />
                        <span className="font-medium">Downloading...</span>
                    </div>
                    <span className="font-mono opacity-80">{progress ? Math.round(progress.percentage) : 0}%</span>
                </div>
                {progress && (
                    <div className="h-1 w-full bg-accent/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent transition-all duration-300 ease-out"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                )}
            </div>
        );
    }

    if (isExtracting) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/20 transition-all">
                <Loader2 size={14} className="animate-spin" />
                <span>Extracting Model...</span>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-mid-gray bg-white/5 rounded-lg border border-white/5 transition-all">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    // Model is ready (downloaded)
    // Check if it's actually loaded in memory
    return (
        <div className={`flex flex-col gap-1 px-3 py-2 text-xs rounded-lg border group transition-all cursor-default
      ${isModelLoaded
                ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20"
                : "text-mid-gray bg-white/5 border-white/5 hover:border-white/10"
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center">
                        {isModelLoaded ? (
                            <>
                                <div className="absolute inset-0 bg-emerald-500 blur-[2px] opacity-40 animate-pulse rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full relative z-10"></div>
                            </>
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full border border-mid-gray/50"></div>
                        )}
                    </div>
                    <span className={`font-medium transition-colors ${isModelLoaded ? "text-text/90" : "text-mid-gray"}`}>
                        {isModelLoaded ? "Model Active" : "Model Idle"}
                    </span>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-semibold transition-colors ${isModelLoaded ? "text-emerald-500/70" : "text-mid-gray/50"}`}>
                    {isModelLoaded ? "RAM" : "Disk"}
                </span>
            </div>
            {currentModelInfo && (
                <span className="text-[10px] text-mid-gray/70 truncate pl-3.5 border-l border-white/5 ml-0.5">
                    {currentModelInfo.name}
                </span>
            )}
        </div>
    );
};
