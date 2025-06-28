import { describe, it, expect, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";

import ImagePage from ".";
import containers from "../../layout/containers";
import { FADE_DURATION_SECONDS } from "../../services/layout";

import layoutTemplate from "../../layout/layout.template.html?raw";

describe("ImagePage", () => {
    const storyMock: any = {
        openPage: vi.fn(),
        restart: vi.fn()
    } as const;
    const configuration: any = {
        imageUrl: "test.png",
        imageCaption: "Test caption",
        title: "Test title",
        subtitle: "Test subtitle"
    } as const;
    const dom = new JSDOM(`<!DOCTYPE html>`);
    const document = dom.window.document;

    beforeEach(() => {
        containers.initLayoutTemplate(layoutTemplate, document.body);
        containers.setThemeContainer(document.body);
    });

    it("renders page elements correctly", async () => {
        const page = new ImagePage(storyMock, configuration);
        await page.show(true);

        expect(
            (document.querySelector(".title-text") as any)?.textContent
        ).toBe("Test title");
        expect(
            (document.querySelector(".subtitle-text") as any)?.textContent
        ).toBe("Test subtitle");
        expect(
            (document.querySelector(".illustration-caption") as any)
                ?.textContent
        ).toBe("Test caption");
    });

    it("sets click listener if nextPage is defined", async () => {
        const page = new ImagePage(storyMock, {
            ...configuration,
            nextPage: "nextPageId"
        });
        await page.show(true);

        const image = document.querySelector(
            ".illustration-image"
        ) as HTMLElement;
        image.click();

        expect(storyMock.openPage).toHaveBeenCalledWith("nextPageId", true);
    });

    it("renders restart button if nextPage is undefined", async () => {
        const page = new ImagePage(storyMock, configuration);
        await page.show(true);

        const restartButton = document.querySelector(
            ".next-page-actions .restart-story-button"
        ) as HTMLButtonElement;

        expect(restartButton).toBeTruthy();

        restartButton.click();

        // wait for the fade out animation to finish
        await new Promise(resolve =>
            setTimeout(resolve, FADE_DURATION_SECONDS * 1000 + 1)
        );

        expect(storyMock.restart).toHaveBeenCalled();
    });
});
