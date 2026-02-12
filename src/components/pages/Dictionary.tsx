import React from "react";
import { Download, Plus, AlertCircle } from "lucide-react";

export const Dictionary = () => {
    return (
        <div className="flex flex-col gap-6 p-6 w-full max-w-4xl mx-auto h-full">

            {/* Dictionary Banner */}
            <div className="bg-card rounded-xl border border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center text-2xl font-serif italic text-green-200">
                        Aa
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="font-serif text-2xl">Your dictionary</h3>
                        <p className="font-mono text-xs opacity-70 max-w-md leading-relaxed">
                            Add words to your dictionary to improve dictation quality. Think: personal names, acronyms, and slang you use.
                        </p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1c1c1c] border border-white/10 rounded hover:bg-white/5 transition-colors text-sm font-mono">
                    <Download size={14} />
                    Import
                </button>
            </div>

            {/* Input Area */}
            <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                    <div className="flex-1 bg-[#1a1a1a] border border-accent rounded px-4 py-3 flex items-center">
                        <div className="w-0.5 h-5 bg-accent mr-2 animate-pulse"></div>
                        <input
                            type="text"
                            value="Original"
                            className="bg-transparent border-none outline-none flex-1 font-mono text-sm"
                            readOnly
                        />
                    </div>
                    <button className="px-6 bg-[#d4d4d8] text-black rounded hover:bg-white transition-colors text-sm font-medium flex items-center gap-2">
                        <Plus size={16} />
                        Add
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle Switch */}
                    <div className="w-10 h-6 bg-[#1a1a1a] rounded-full relative cursor-pointer border border-white/10">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-gray-600 rounded-full" />
                    </div>
                    <span className="text-xs font-mono text-mid-gray">Add replacement</span>
                    <AlertCircle size={14} className="text-mid-gray ml-1" />
                </div>
            </div>

            {/* Empty State */}
            <div className="flex-1 bg-card rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[300px]">
                <p className="font-medium mb-1">Your dictionary is empty</p>
                <p className="text-sm text-mid-gray/60">Add words to customize how your voice dictation behaves.</p>
            </div>

        </div>
    );
};
