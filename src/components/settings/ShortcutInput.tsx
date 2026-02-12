import React from "react";
import { useSettings } from "../../hooks/useSettings";
import { GlobalShortcutInput } from "./GlobalShortcutInput";

interface ShortcutInputProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
  shortcutId: string;
  disabled?: boolean;
}

/**
 * Wrapper component for shortcut input.
 * Now uses GlobalShortcutInput for all implementations.
 */
export const ShortcutInput: React.FC<ShortcutInputProps> = (props) => {
  return <GlobalShortcutInput {...props} />;
};

