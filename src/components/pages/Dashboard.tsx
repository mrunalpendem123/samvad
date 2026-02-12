import React, { useEffect, useState } from "react";
import { Mic, Globe, Flame } from "lucide-react";
import { commands, HistoryEntry } from "@/bindings";
import { format, subDays, isSameDay } from "date-fns";



export const Dashboard = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [stats, setStats] = useState({
        totalWords: 0,
        timeSavedDisplay: "0s",
        activeDays: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await commands.getHistoryEntries();
            if (result.status === "ok") {
                const data = result.data;
                // Sort desc
                data.sort((a, b) => b.timestamp - a.timestamp);
                setHistory(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        }
    };

    const calculateStats = (data: HistoryEntry[]) => {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentDocs = data.filter(d => new Date(d.timestamp * 1000) >= thirtyDaysAgo);

        let wordCount = 0;
        const uniqueDays = new Set();

        recentDocs.forEach(d => {
            // Use post_processed_text if available, otherwise transcription_text
            const text = d.post_processed_text || d.transcription_text || "";
            const words = text.trim().split(/\s+/).length;
            if (text.trim().length === 0) return; // Don't count empty strings

            wordCount += words;
            uniqueDays.add(format(new Date(d.timestamp * 1000), "yyyy-MM-dd"));
        });

        // Assumption: 40 WPM typing speed
        const totalSecondsSaved = Math.round((wordCount / 40) * 60);

        // Format: "4s" or "2m"
        let timeSavedString = "";
        if (totalSecondsSaved < 60) {
            timeSavedString = `${totalSecondsSaved}s`;
        } else {
            timeSavedString = `${Math.round(totalSecondsSaved / 60)}m`;
        }

        setStats({
            totalWords: wordCount,
            timeSavedDisplay: timeSavedString,
            activeDays: uniqueDays.size,
        });
    };

    // Generate heatmap data (last 28 days)
    const generateHeatmap = () => {
        const days = [];
        const today = new Date();
        for (let i = 27; i >= 0; i--) {
            const day = subDays(today, i);
            const hasActivity = history.some(h => isSameDay(new Date(h.timestamp * 1000), day));
            days.push({ day, hasActivity, isToday: i === 0 });
        }
        return days;
    };

    const heatmapData = generateHeatmap();

    return (
        <div className="flex flex-col gap-6 p-6 w-full max-w-5xl mx-auto text-text h-full overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-mono mb-2">Stats (last 30 days)</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm border border-white/10">
                    <span className="text-sm font-mono opacity-80 mb-2">Total words</span>
                    <span className="text-4xl md:text-5xl font-bold font-serif">{stats.totalWords}</span>
                </div>
                <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm border border-white/10">
                    <span className="text-sm font-mono opacity-80 mb-2">Time saved</span>
                    <span className="text-4xl md:text-5xl font-bold font-serif">{stats.timeSavedDisplay}</span>
                </div>
                <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm border border-white/10">
                    <span className="text-sm font-mono opacity-80 mb-2">Total Notes</span>
                    <span className="text-4xl md:text-5xl font-bold font-serif">{history.length}</span>
                </div>
            </div>

            {/* Message Banner */}
            <div className="bg-card/50 border border-accent/20 rounded-lg p-3 px-4">
                <p className="text-accent font-mono text-sm">
                    {stats.totalWords > 0
                        ? `Great job! You've captured ${stats.totalWords} words without typing.`
                        : "Ready to start? Press your shortcut to record."}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Sources */}
                <div>
                    <h3 className="text-lg font-mono mb-4">Top sources</h3>
                    <div className="bg-card rounded-xl border border-white/5 p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                    <Mic size={16} className="text-white" />
                                </div>
                                <span className="font-medium">Voice Note</span>
                            </div>
                            <span className="font-sans text-sm opacity-60">{stats.totalWords} words</span>
                        </div>
                        {/* Placeholder for future sources */}
                        {/* <div className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                  <Globe size={16} className="text-white" />
                </div>
                <span className="font-mono">System</span>
              </div>
              <span className="font-mono opacity-60">0 words</span>
            </div> */}
                    </div>
                </div>

                {/* Monthly Activity */}
                <div>
                    <h3 className="text-lg font-mono mb-4">Monthly activity</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between font-mono text-xs opacity-50 px-1">
                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {heatmapData.map((d, i) => (
                                <div
                                    key={i}
                                    title={format(d.day, "MMM d")}
                                    className={`aspect-square rounded transition-all duration-300 ${d.isToday
                                        ? "bg-accent shadow-[0_0_10px_rgba(37,99,235,0.5)] border border-accent/50"
                                        : d.hasActivity
                                            ? "bg-accent/40 border border-accent/20"
                                            : "bg-card border border-white/5"
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs font-mono opacity-60">
                            <Flame size={12} className="text-orange-500" />
                            <span>{stats.activeDays} active days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transcripts */}
            <div>
                <h3 className="text-lg font-mono mb-4">Recent transcripts</h3>
                <div className="flex flex-col gap-4">
                    {history.length === 0 ? (
                        <p className="text-mid-gray font-mono text-sm">No recent transcripts.</p>
                    ) : (
                        history.slice(0, 3).map((item) => (
                            <div key={item.id} className="bg-card/50 rounded-xl p-4 border border-white/5 flex gap-4 hover:border-white/10 transition-colors">
                                <span className="font-mono text-sm opacity-60 w-16 shrink-0">
                                    {format(new Date(item.timestamp * 1000), "h:mm a")}
                                </span>
                                <div className="w-0.5 bg-white/10 self-stretch"></div>
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                                            <Mic size={10} className="text-white" />
                                        </div>
                                        <span className="font-medium text-sm truncate">Voice Note</span>
                                    </div>
                                    {item.transcription_text && (
                                        <p className="font-mono text-[13px] leading-relaxed text-text/80 line-clamp-2">{item.post_processed_text || item.transcription_text}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
