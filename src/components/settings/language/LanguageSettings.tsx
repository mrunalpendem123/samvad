import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { LanguageSelector } from "../LanguageSelector";
import { useModelStore } from "../../../stores/modelStore";

export const LanguageSettings: React.FC = () => {
    const { t } = useTranslation();
    const { currentModel, getModelInfo } = useModelStore();
    const currentModelInfo = getModelInfo(currentModel);

    // Filter languages based on the current model's supported languages (if available)
    // Note: This logic assumes LanguageSelector internally uses the setting 'selected_language'
    // and we might need to pass a filter prop if we want to enforce it strictly UI-side.
    // However, LanguageSelector currently shows ALL languages.
    // The user requested: "keep all those languages, these two models support. So that I can select that language if I'm speaking that language."

    // Since LanguageSelector is generic, we will use it as is, but place it here clearly.
    // If we need to filter, we would need to pass props to LanguageSelector to filter the list.
    // Currently LanguageSelector imports LANGUAGES constant.

    // We display a message about the current model's capabilities
    const supportedLanguages = currentModelInfo?.languages || [];
    const isMultilingual = supportedLanguages.length > 1;

    return (
        <div className="max-w-3xl w-full mx-auto space-y-6">
            <SettingsGroup title={t("settings.general.language.title")}>
                <div className="mb-4 text-sm text-text/70">
                    {currentModelInfo ? (
                        <>
                            Current Model: <span className="font-semibold text-text">{currentModelInfo.name}</span>
                            <br />
                            Supports: {isMultilingual
                                ? `${supportedLanguages.slice(0, 5).join(", ")}${supportedLanguages.length > 5 ? "..." : ""}`
                                : supportedLanguages[0] || "English"}
                        </>
                    ) : (
                        "Select a model to see supported languages."
                    )}
                </div>
                <LanguageSelector descriptionMode="inline" grouped={false} supportedLanguages={supportedLanguages} />
            </SettingsGroup>
        </div>
    );
};
