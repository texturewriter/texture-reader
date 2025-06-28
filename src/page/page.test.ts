import { describe, it, expect, vi } from "vitest";

import Page from "./page";
import containers from "../layout/containers";

import layoutTemplate from "../layout/layout.template.html?raw";

class P extends Page {
    constructor(story: any, exitEvent?: any) {
        super(story);

        this.exitEvent = exitEvent;
    }

    protected renderPage(): void {}
}

describe("Page", () => {
    it("calls story.openPage when actionCount reaches timer count", () => {
        const story = { openPage: vi.fn() };
        const page = new P(story, { timer: { target: "pageId", count: 2 } });

        page.incrementActionCount();
        expect(story.openPage).not.toHaveBeenCalled();

        page.incrementActionCount();
        expect(story.openPage).toHaveBeenCalledWith("pageId", false);
    });

    it("getNounElement should query the DOM for the noun", () => {
        containers.initLayoutTemplate(layoutTemplate, document.body);

        containers.story.innerHTML =
            '<p><span class="noun" data-noun-id="123">Test</span></p>';

        const element = Page.getNounElement("123");

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element?.textContent).toBe("Test");
    });
});
