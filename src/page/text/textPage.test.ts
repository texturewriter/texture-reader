import { describe, it, expect, beforeEach } from "vitest";

import TextPage from ".";
import containers from "../../layout/containers";

import layoutTemplate from "../../layout/layout.template.html?raw";

describe("TextPage", () => {
    beforeEach(() => {
        containers.initLayoutTemplate(layoutTemplate, document.body);
        containers.setThemeContainer(document.body);

        document.body.innerHTML =
            '<div id="story"></div><div id="verbs"></div>';
    });

    it("renders page correctly", () => {
        const page = new TextPage({} as any, {
            id: "test",
            name: "Test Page",
            text: [
                { elem: "p" },
                { elem: "span", text: "hello" },
                { text: " " },
                { elem: "i", text: "world" }
            ],
            verbs: [{ id: "v1", name: "verb" }],
            actions: [],
            events: {}
        });

        page.show();

        expect(containers.story.textContent).toBe("hello world");
        expect(containers.story.querySelector("p")).toBeTruthy();
        expect(containers.story.querySelector("span")).toBeTruthy();
        expect(containers.story.querySelector("i")).toBeTruthy();
        expect(containers.story.querySelector("br")).toBeFalsy();
    });
});
