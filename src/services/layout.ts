import { pause } from "./async";
import type { TextureConfig } from "../story";

import "./layout.css";

const MAX_FONT_SIZE = 30;
const MIN_FONT_SIZE = 10;
export const TRIANGLE_CLASS = "bottom-triangle";
const FADE_IN_CLASS = "fade-in";
const FADE_OUT_CLASS = "fade-out";

/**
 * Resizes text content's font so that it fits maximally inside its container
 */
export const resizeTextToFit = (element: HTMLElement, height?: number) => {
    // Hack to ignore the little triangle's height in the calculations:
    // if the element is being dragged, remove the class that adds the triangle while calculating the font size
    let isDragging = element.classList.contains(TRIANGLE_CLASS);
    element.classList.remove(TRIANGLE_CLASS);

    const targetHeight = height ?? element.clientHeight;

    for (let fontSize = MAX_FONT_SIZE; fontSize >= MIN_FONT_SIZE; fontSize--) {
        element.style.fontSize = `${fontSize}px`;

        if (
            element.scrollHeight <= targetHeight &&
            element.scrollWidth <= element.clientWidth
        ) {
            break;
        }
    }

    if (isDragging) {
        element.classList.add(TRIANGLE_CLASS);
    }
};

export const FADE_DURATION_SECONDS = 0.6;

/**
 * Fade in a hidden element
 */
export const fadeInElement = (element: HTMLElement): Promise<void> => {
    element.classList.remove(FADE_OUT_CLASS);
    element.classList.add(FADE_IN_CLASS);
    return pause(FADE_DURATION_SECONDS);
};

/**
 * Fade out an element until it's hidden
 */
export const fadeOutElement = (element: HTMLElement): Promise<void> => {
    element.classList.remove(FADE_IN_CLASS);
    element.classList.add(FADE_OUT_CLASS);
    return pause(FADE_DURATION_SECONDS);
};

/**
 * Process dynamic story text
 */
export const processStoryTextContent = (text: string) => {
    return text.replaceAll("_", " ");
};

/**
 * Process dynamic story content into HTML elements
 */
export const newContentToDomNodes = (
    text: string,
    oldNoun: HTMLElement
): HTMLSpanElement => {
    const textContent = processStoryTextContent(text);
    const bracketSearch = textContent.match(/(.*?)\[(.+?)\](.*)/);
    const span = document.createElement("span");

    if (bracketSearch) {
        span.append(bracketSearch[1]);

        // The old span replaces the bracketed part with the new text.
        // Make sure the old noun is disabled and doesn't get moved if the element stays on the page
        const oldNounReplacement = document.createElement("span");
        oldNounReplacement.textContent = oldNoun.textContent;
        oldNoun.parentNode?.replaceChild(oldNounReplacement, oldNoun);
        oldNoun.textContent = bracketSearch[2];
        oldNoun.className = "noun";
        span.append(oldNoun);
        span.append(bracketSearch[3]);
    } else {
        span.textContent = textContent;
    }

    return span;
};

/**
 * Resolves the container element based on the provided option.
 * If no option is given, creates a new container at the end of the document body.
 * The container option can be either an existing element or a query string.
 */
export const resolveStoryContainer = (
    containerOption: TextureConfig["storyContainer"]
): HTMLElement => {
    if (!containerOption) {
        const container = document.createElement("div");
        document.body.appendChild(container);
        return container;
    }

    if (typeof containerOption === "string") {
        const container = document.querySelector(containerOption);

        if (!container) {
            throw new Error(
                "Could not find a story container using query selector " +
                    containerOption
            );
        }

        if (!(container instanceof HTMLElement)) {
            throw new Error(
                "The provided story container must be of type HTMLElement"
            );
        }

        return container;
    }

    if (containerOption instanceof HTMLElement) {
        return containerOption;
    }

    if ((containerOption as any) instanceof Element) {
        throw new Error(
            "The provided story container must be of type HTMLElement"
        );
    }

    throw new Error("Invalid story container option");
};
