import React from "react";
import { useTranslation } from "react-i18next";
import {
  Home,
  Clock,
  Wand2,
  BookA,
  Settings,
  UserCircle,
  HelpCircle,
  Download,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { Transcripts } from "./pages/Transcripts";
import { Instructions } from "./pages/Instructions";
import { Dictionary } from "./pages/Dictionary";
import { GeneralSettings, LanguageSettings } from "./settings"; // Fallback for settings
import { useSettings } from "../hooks/useSettings";
import ModelSelector from "./model-selector/ModelSelector";

export type SidebarSection = keyof typeof SECTIONS_CONFIG;

export const SECTIONS_CONFIG = {
  dashboard: {
    labelKey: "sidebar.dashboard",
    icon: Home,
    component: Dashboard,
    enabled: () => true,
  },
  transcripts: {
    labelKey: "sidebar.transcripts",
    icon: Clock,
    component: Transcripts,
    enabled: () => true,
  },
  instructions: {
    labelKey: "sidebar.instructions",
    icon: Wand2,
    component: Instructions,
    enabled: () => true,
  },
  dictionary: {
    labelKey: "sidebar.dictionary",
    icon: BookA,
    component: Dictionary,
    enabled: () => true,
  },
  // Keep settings hidden from main nav but available for routing
  settings: {
    labelKey: "sidebar.settings",
    icon: Settings,
    component: GeneralSettings,
    enabled: () => true,
  },
  languages: {
    labelKey: "sidebar.languages",
    icon: BookA, // Reusing icon or pick a new one
    component: LanguageSettings,
    enabled: () => true,
  },
} as const;

interface SidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();

  const mainNavItems = [
    "dashboard",
    "transcripts",
  ] as const;

  const bottomNavItems = [
    { id: "languages", icon: BookA, label: "Languages" },
    { id: "settings", icon: Settings, label: "Settings" },
  ] as const;

  return (
    <div className="flex flex-col w-64 h-full bg-[#18181b] border-r border-white/5 text-sm font-medium">
      {/* App Header */}
      <div className="p-6 pb-8">
        <h1 className="font-sans text-xl font-bold text-text tracking-tight">Think AI</h1>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-1 px-3">
        {mainNavItems.map((id) => {
          const config = SECTIONS_CONFIG[id];
          const Icon = config.icon;
          const isActive = activeSection === id;

          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-accent text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "text-mid-gray hover:text-text hover:bg-white/5"
                }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-mid-gray group-hover:text-text"} />
              <span className="capitalize">{id}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="px-3 pb-2">
        <ModelSelector />
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col gap-1 px-3 pb-6">
        {bottomNavItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id as SidebarSection);
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                ? "text-text bg-white/5"
                : "text-mid-gray hover:text-text hover:bg-white/5"
                }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
};
