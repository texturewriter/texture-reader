import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
    fadeInElement,
    fadeOutElement,
    processStoryTextContent,
    resolveStoryContainer,
    FADE_DURATION_SECONDS
} from "../layout";

describe("layout", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("fadeInElement", () => {
        it("fades in an element", async () => {
            const elem = document.createElement("div");
            elem.classList.add("fade-out");
            const promise = fadeInElement(elem);
            expect(elem.classList.contains("fade-out")).toBe(false);
            expect(elem.classList.contains("fade-in")).toBe(true);
            vi.advanceTimersByTime(FADE_DURATION_SECONDS * 1000);
            await expect(promise).resolves.toBeUndefined();
        });
    });

    describe("fadeOutElement", () => {
        it("fades out an element", async () => {
            const elem = document.createElement("div");
            elem.classList.add("fade-in");
            const promise = fadeOutElement(elem);
            expect(elem.classList.contains("fade-in")).toBe(false);
            expect(elem.classList.contains("fade-out")).toBe(true);
            vi.advanceTimersByTime(FADE_DURATION_SECONDS * 1000);
            await expect(promise).resolves.toBeUndefined();
        });
    });

    describe("processStoryTextContent", () => {
        it("processes story text correctly", () => {
            expect(processStoryTextContent("__hello_world_")).toBe(
                "  hello world "
            );
        });
    });

    describe("resolveStoryContainer", () => {
        it("resolves story container when no option is passed", () => {
            const container = resolveStoryContainer(undefined);
            expect(container).toBeInstanceOf(HTMLElement);
            expect(document.body.contains(container)).toBe(true);
        });

        it("resolves story container when an element is passed", () => {
            const elem = document.createElement("div");
            const result = resolveStoryContainer(elem);
            expect(result).toBe(elem);
        });

        it("resolves story container when a valid selector is passed", () => {
            const elem = document.createElement("div");
            elem.id = "test";
            document.body.appendChild(elem);
            const result = resolveStoryContainer("#test");
            expect(result).toBe(elem);
        });

        it("throws an error when the story container selector is invalid", () => {
            expect(() => resolveStoryContainer("#nope")).toThrow();
        });
    });
});
