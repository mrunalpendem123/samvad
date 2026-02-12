import React, { useEffect, useState } from "react";
import { Search, Info, Mic, Trash2, Copy, Check } from "lucide-react";
import { commands, HistoryEntry } from "@/bindings";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

export const Transcripts = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState<number | null>(null);

    useEffect(() => {
        loadHistory();
        // Poll for updates every 5 seconds
        const interval = setInterval(loadHistory, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadHistory = async () => {
        try {
            const result = await commands.getHistoryEntries();
            if (result.status === "ok") {
                // Sort by timestamp desc
                const sorted = result.data.sort((a, b) => b.timestamp - a.timestamp);
                setHistory(sorted);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            const result = await commands.deleteHistoryEntry(id);
            if (result.status === "ok") {
                setHistory((prev) => prev.filter((item) => item.id !== id));
                toast.success("Transcript deleted");
            }
        } catch (error) {
            toast.error("Failed to delete transcript");
        }
    };

    const handleCopy = async (text: string, id: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            toast.success("Copied to clipboard");
        } catch (err) {
            toast.error("Failed to copy");
        }
    };

    const filteredHistory = history.filter((item) =>
        item.transcription_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.post_processed_text && item.post_processed_text.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group by date
    const groupedHistory = filteredHistory.reduce((groups, item) => {
        const date = new Date(item.timestamp * 1000);
        let dateLabel = format(date, "MMMM d, yyyy");

        if (isToday(date)) dateLabel = "Today";
        else if (isYesterday(date)) dateLabel = "Yesterday";

        if (!groups[dateLabel]) groups[dateLabel] = [];
        groups[dateLabel].push(item);
        return groups;
    }, {} as Record<string, HistoryEntry[]>);

    return (
        <div className="flex flex-col gap-6 p-6 w-full max-w-4xl mx-auto h-full overflow-hidden">
            {/* Search Bar */}
            <div className="bg-card rounded-lg flex items-center px-4 py-3 gap-3 border border-white/5 shadow-sm">
                <Search size={18} className="text-mid-gray" />
                <input
                    type="text"
                    placeholder="Search transcripts by word or sentence"
                    className="bg-transparent border-none outline-none flex-1 font-mono text-sm placeholder:text-mid-gray/70 text-text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Info Banner */}
            <div className="flex items-center gap-3 px-4 py-3 bg-card/30 rounded-lg border border-white/5 text-xs text-mid-gray">
                <Info size={14} />
                <span>Audio files are automatically deleted after 14 days to save space, but transcripts are retained locally.</span>
            </div>

            {/* Transcripts List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-2 custom-scrollbar">
                {Object.entries(groupedHistory).map(([dateLabel, items]) => (
                    <div key={dateLabel} className="flex flex-col gap-2">
                        <div className="text-xs font-mono opacity-50 uppercase tracking-wider mb-2 pl-1">{dateLabel}</div>

                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-card rounded-xl border border-white/5 flex overflow-hidden group hover:border-white/10 transition-colors"
                                onClick={() => handleCopy(item.post_processed_text || item.transcription_text, item.id)}
                            >
                                <div className="w-24 bg-transparent p-4 flex flex-col items-start border-r border-white/5 shrink-0">
                                    <span className="font-mono text-xs opacity-60">
                                        {format(new Date(item.timestamp * 1000), "h:mm a")}
                                    </span>
                                </div>
                                <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                                                <Mic size={10} className="text-white" />
                                            </div>
                                            <span className="font-medium text-xs opacity-80 truncate">{item.title || "Voice Note"}</span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                title="Copy text"
                                            >
                                                {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-mid-gray" />}
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, item.id)}
                                                className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} className="text-mid-gray hover:text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="font-mono text-sm leading-relaxed text-text/90 whitespace-pre-wrap break-words">
                                        {item.post_processed_text || item.transcription_text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Mic size={48} className="mb-4 text-mid-gray" />
                        <p className="font-mono text-mid-gray">No transcripts yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};
