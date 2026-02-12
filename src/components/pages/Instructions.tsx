import React from "react";
import { Plus, Edit2 } from "lucide-react";

const ModeCard = ({ title, icon: Icon, color = "bg-green-500" }: { title: string, icon?: any, color?: string }) => (
    <div className="bg-card rounded-xl border border-white/5 p-4 flex flex-col justify-between h-32 relative group">
        <div className="flex justify-between items-start">
            <span className="font-mono text-sm">{title}</span>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors">
                <Edit2 size={12} />
                Edit
            </button>
        </div>

        <div className="flex justify-between items-end mt-4">
            <div className="flex gap-2">
                {Icon && <img src={Icon} className="w-6 h-6" alt="" />}
                {/* Placeholder for icons if needed */}
            </div>

            {/* Toggle Switch */}
            <div className="w-10 h-6 bg-accent rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-sky-300 rounded-full shadow-sm" />
            </div>
        </div>
    </div>
);

export const Instructions = () => {
    return (
        <div className="flex flex-col gap-6 p-6 w-full max-w-4xl mx-auto h-full">

            <div className="flex flex-col gap-2">
                <h3 className="font-mono text-sm opacity-80">Custom instructions</h3>
                <p className="text-xs text-mid-gray mb-2">Add guidance like "use British English," "be concise," or any other preferences.</p>
                <textarea
                    className="w-full h-32 bg-card rounded-xl border border-white/5 p-4 font-mono text-sm resize-none focus:outline-none focus:border-accent/50 transition-colors"
                    placeholder=""
                />
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono text-sm opacity-80">Modes</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#d4d4d8] text-black rounded hover:bg-white transition-colors text-sm font-medium">
                        <Plus size={16} />
                        Create mode
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ModeCard title="Messaging" />
                    <ModeCard title="Coding" />
                    <ModeCard title="Email" />
                    <ModeCard title="Notes" />
                </div>
            </div>
        </div>
    );
};
