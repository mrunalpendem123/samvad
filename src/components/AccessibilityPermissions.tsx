import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import {
  checkAccessibilityPermission,
  requestAccessibilityPermission,
} from "tauri-plugin-macos-permissions-api";
import { commands } from "@/bindings";
import { useSettingsStore } from "@/stores/settingsStore";

// Define permission state type
type PermissionState = "request" | "verify" | "granted";

// Define button configuration type
interface ButtonConfig {
  text: string;
  className: string;
}

const AccessibilityPermissions: React.FC = () => {
  const { t } = useTranslation();
  const [hasAccessibility, setHasAccessibility] = useState<boolean>(false);
  const [permissionState, setPermissionState] =
    useState<PermissionState>("request");
  const refreshSettings = useSettingsStore((state) => state.refreshSettings);
  const hasEnabledShortcutsRef = useRef<boolean>(false);

  // Check permissions without requesting
  const checkPermissions = async (): Promise<boolean> => {
    const hasPermissions: boolean = await checkAccessibilityPermission();
    setHasAccessibility(hasPermissions);
    setPermissionState(hasPermissions ? "granted" : "verify");
    return hasPermissions;
  };

  // Handle the unified button action based on current state
  const handleButtonClick = async (): Promise<void> => {
    if (permissionState === "request") {
      try {
        await requestAccessibilityPermission();
        // After system prompt, transition to verification state
        setPermissionState("verify");
      } catch (error) {
        console.error("Error requesting permissions:", error);
        setPermissionState("verify");
      }
    } else if (permissionState === "verify") {
      // State is "verify" - check if permission was granted
      await checkPermissions();
    }
  };

  // On app boot - check permissions and poll continuously
  useEffect(() => {
    const initialSetup = async (): Promise<void> => {
      const hasPermissions: boolean = await checkAccessibilityPermission();
      setHasAccessibility(hasPermissions);
      setPermissionState(hasPermissions ? "granted" : "request");
    };

    initialSetup();

    // Poll for permission changes every 2 seconds
    const pollInterval = setInterval(async () => {
      const hasPermissions: boolean = await checkAccessibilityPermission();
      setHasAccessibility(hasPermissions);
      if (hasPermissions) {
        setPermissionState("granted");
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (!hasAccessibility || hasEnabledShortcutsRef.current) return;
    hasEnabledShortcutsRef.current = true;

    commands.initializeEnigo().catch((e) => {
      console.warn("Failed to initialize Enigo:", e);
    });

    commands
      .changeKeyboardImplementationSetting("handy_keys")
      .then(() => refreshSettings())
      .catch((e) => {
        console.warn("Failed to enable handy-keys:", e);
      });
  }, [hasAccessibility, refreshSettings]);

  if (hasAccessibility) {
    return null;
  }

  // Configure button text and style based on state
  const buttonConfig: Record<PermissionState, ButtonConfig | null> = {
    request: {
      text: t("accessibility.openSettings"),
      className:
        "px-2 py-1 text-sm font-semibold bg-mid-gray/10 border  border-mid-gray/80 hover:bg-logo-primary/10 rounded cursor-pointer hover:border-logo-primary",
    },
    verify: {
      text: t("accessibility.openSettings"),
      className:
        "bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-3 rounded text-sm flex items-center justify-center cursor-pointer",
    },
    granted: null,
  };

  const config = buttonConfig[permissionState] as ButtonConfig;

  return (
    <div className="p-5 w-full rounded-xl border border-card-border bg-card shadow-sm backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text mb-1">{t("accessibility.title", "Accessibility Required")}</h3>
            <p className="text-xs text-mid-gray leading-relaxed">
              {permissionState === 'verify'
                ? t("accessibility.verifyDescription", "Permissions granted? You may need to restart the app for changes to take effect.")
                : t("accessibility.permissionsDescription")}
            </p>
          </div>
          <button
            onClick={async () => {
              if (permissionState === 'verify') {
                // Relaunch the app
                const { relaunch } = await import('@tauri-apps/plugin-process');
                await relaunch();
              } else {
                handleButtonClick();
              }
            }}
            className={`min-h-9 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm
              ${permissionState === 'verify'
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white"
              }`}
          >
            {permissionState === 'verify' ? "Restart App" : config.text}
          </button>
        </div>

        {permissionState === 'request' && (
          <div className="flex gap-2 items-center text-[10px] text-mid-gray/70 bg-background/50 p-2 rounded-md border border-white/5">
            <Info size={12} />
            <span>If you see duplicate "Think AI" entries in permissions, try removing the old ones.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityPermissions;
