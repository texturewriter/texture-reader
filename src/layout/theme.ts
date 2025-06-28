import containers from "./containers";

import "./theme.css";

export interface TextureTheme {
    bgColor?: string;
    font?: string;
    textColor?: string;
}

/**
 * Set classes for story visual theme
 */
export const setTheme = (
    theme: TextureTheme | undefined,
    container: HTMLElement | string
) => {
    if (!theme || typeof theme !== "object") {
        return;
    }

    const themeContainer: HTMLElement | null =
        typeof container === "string"
            ? document.querySelector(container)
            : container;

    if (!themeContainer) {
        throw new Error("Theme container not found");
    }

    if (!(themeContainer instanceof HTMLElement)) {
        throw new Error("Provided theme container is not a HTML element");
    }

    themeContainer.classList.add("texture-theme-container");

    if (theme.bgColor) {
        themeContainer.style.backgroundColor = "#" + theme.bgColor;
    }

    if (theme.font) {
        themeContainer.classList.add("texture-font-" + theme.font);
    }

    if (theme.textColor) {
        themeContainer.style.color = "#" + theme.textColor;
    }

    containers.setThemeContainer(themeContainer);
};
