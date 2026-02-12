import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SettingContainer } from "../ui/SettingContainer";
import { Input } from "../ui/Input";
import { useSettings } from "../../hooks/useSettings";

interface SarvamApiKeyProps {
  descriptionMode?: "tooltip" | "inline";
  grouped?: boolean;
  disabled?: boolean;
}

export const SarvamApiKey: React.FC<SarvamApiKeyProps> = ({
  descriptionMode = "tooltip",
  grouped = false,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating } = useSettings();
  const savedApiKey = getSetting("sarvam_api_key") ?? "";
  const [value, setValue] = useState(savedApiKey);

  useEffect(() => {
    setValue(savedApiKey);
  }, [savedApiKey]);

  const persist = async () => {
    const trimmed = value.trim();
    if (trimmed === savedApiKey) return;

    try {
      await updateSetting("sarvam_api_key", trimmed);
    } catch (error) {
      console.error("Failed to update Sarvam API key:", error);
      toast.error(
        t("settings.general.sarvamApiKey.errors.save", {
          defaultValue: "Failed to save Sarvam API key",
        }),
      );
    }
  };

  return (
    <SettingContainer
      title={t("settings.general.sarvamApiKey.title", "Sarvam API Key")}
      description={t(
        "settings.general.sarvamApiKey.description",
        "Required for Online mode (Sarvam AI transcription).",
      )}
      descriptionMode={descriptionMode}
      grouped={grouped}
      layout="horizontal"
      disabled={disabled}
    >
      <Input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={persist}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void persist();
          }
        }}
        placeholder={t(
          "settings.general.sarvamApiKey.placeholder",
          "Paste your Sarvam API key",
        )}
        disabled={disabled || isUpdating("sarvam_api_key")}
        autoComplete="off"
        spellCheck={false}
        className="min-w-[220px]"
      />
    </SettingContainer>
  );
};
