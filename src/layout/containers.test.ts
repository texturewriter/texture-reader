import { describe, it, expect, beforeEach } from "vitest";
import containers from "./containers";

describe("ContainerElements", () => {
    let mainContainer: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = "";
        mainContainer = document.createElement("div");
        document.body.appendChild(mainContainer);
        containers.reset();
    });

    it("initializes correctly with valid template", () => {
        const template = `
            <div class="story">Story content</div>
            <div class="verbs">Verbs content</div>
        `;
        containers.initLayoutTemplate(template, mainContainer);
        expect(containers.story.textContent).toBe("Story content");
        expect(containers.verbs.textContent).toBe("Verbs content");
        expect(mainContainer.classList.contains("texture-container")).toBe(
            true
        );
    });

    it("throws an error if elements are missing", () => {
        const verbsOnlyTemplate = `<div class="verbs">Verbs only</div>`;

        expect(() => {
            containers.initLayoutTemplate(verbsOnlyTemplate, mainContainer);
        }).toThrow("Container template doesn't contain");

        containers.reset();

        const storyOnlyTemplate = `<div class="story">Verbs only</div>`;

        expect(() => {
            containers.initLayoutTemplate(storyOnlyTemplate, mainContainer);
        }).toThrow("Container template doesn't contain");
    });

    it("throws an error if accessing containers before initialization", () => {
        expect(() => containers.actions).toThrow("Actions container not set");
        expect(() => containers.story).toThrow("Story container not set");
        expect(() => containers.theme).toThrow("Theme container not set");
        expect(() => containers.verbs).toThrow("Verbs container not set");
    });

    it("resizeStoryText fails gracefully if containers haven't been initialized", () => {
        expect(() => containers.resizeStoryText()).not.toThrow();
    });
});
