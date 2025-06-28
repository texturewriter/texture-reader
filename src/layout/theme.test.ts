import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setTheme } from "./theme";

describe("setTheme", () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "container";
        document.body.append(container);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("adds the theme class to the container", () => {
        setTheme({}, container);
        expect(container.classList.contains("texture-theme-container"));
    });

    it("finds the container by selector", () => {
        setTheme({}, "#container");
        expect(container.classList.contains("texture-theme-container"));
    });

    it("throws an error if the container doesn't exist", () => {
        expect(() => setTheme({}, "#non-existing")).toThrowError(
            "Theme container not found"
        );
    });

    it("throws an error if the container is not a HTML element", () => {
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        expect(() => setTheme({}, svg as any)).toThrowError(
            "Provided theme container is not a HTML element"
        );
    });

    it("adds all expected classes when full theme is provided", () => {
        setTheme(
            { bgColor: "dddcdd", font: "abel", textColor: "6d1111" },
            container
        );

        expect(container.style.backgroundColor).toBe("rgb(221, 220, 221)");
        expect(container.classList.contains("texture-font-abel")).toBe(true);
        expect(container.style.color).toBe("rgb(109, 17, 17)");
    });

    it("adds only the bgColor class if only bgColor is provided", () => {
        setTheme({ bgColor: "dddcdd" } as any, container);

        expect(container.style.backgroundColor).toBe("rgb(221, 220, 221)");
        expect(container.classList.length).toBe(1); // only texture-theme-container
        expect(container.style.color).toBe("");
    });

    it("does not add any style if theme is empty", () => {
        setTheme({} as any, container);
        expect(container.style.backgroundColor).toBe("");
        expect(container.classList.length).toBe(1); // only texture-theme-container
        expect(container.style.color).toBe("");
    });

    it("does nothing if theme is null", () => {
        setTheme(null as any, container);
        expect(container.style.backgroundColor).toBe("");
        expect(container.classList.length).toBe(0);
        expect(container.style.color).toBe("");
    });

    it("does nothing if theme is not an object", () => {
        setTheme("invalid" as any, container);
        expect(container.style.backgroundColor).toBe("");
        expect(container.classList.length).toBe(0);
        expect(container.style.color).toBe("");
    });
});
