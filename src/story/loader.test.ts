import { describe, it, expect, vi } from "vitest";

import StoryDataLoader from "./loader";
import type { BookSerialization } from "../story";

describe("StoryDataLoader", () => {
    const story: BookSerialization = { title: "Test Story" } as any;

    it("returns a story if passed as an object", async () => {
        const loader = new StoryDataLoader(story);
        expect(await loader.getBook()).toEqual(story);
    });

    it("parses a valid JSON story string", async () => {
        const loader = new StoryDataLoader('{"title": "Test Story"}');
        expect(await loader.getBook()).toEqual({ title: "Test Story" });
    });

    it("fetches a story from a URL", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => story
        });
        const loader = new StoryDataLoader(
            "http://example.com/story.json",
            false
        );
        expect(await loader.getBook()).toEqual(story);
    });

    it("throws an error if fetch fails", async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error("Fetch error"));
        const loader = new StoryDataLoader(
            "http://example.com/story.json",
            false
        );

        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await expect(loader.getBook()).rejects.toThrow(
            "Could not fetch story file"
        );

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: "Not found"
        });
        const loader2 = new StoryDataLoader(
            "http://example.com/story.json",
            false
        );
        await expect(loader2.getBook()).rejects.toThrow(
            "HTTP error 404: Not found"
        );

        consoleErrorSpy.mockRestore();
    });

    it("throws an error if fetched data is invalid JSON", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => JSON.parse("invalid")
        });
        const loader = new StoryDataLoader(
            "http://example.com/story.json",
            false
        );

        await expect(loader.getBook()).rejects.toThrow("Invalid JSON file");
    });

    it("throws an error for invalid JSON", async () => {
        expect(() => new StoryDataLoader("Invalid JSON")).toThrow(
            "Story data is not a valid story JSON string"
        );

        expect(() => new StoryDataLoader("{Invalid JSON}")).toThrow(
            "Invalid JSON story data"
        );
    });

    it("throws an error for missing data and disabled URL options", async () => {
        expect(() => new StoryDataLoader(null, true)).toThrow(
            "No story provided and fetching story from the URL is disabled"
        );
    });

    it("throws an error for missing data in constructor and URL", async () => {
        const loader = new StoryDataLoader(null, false);

        await expect(loader.getBook()).rejects.toThrow(
            "No story provided in config or URL"
        );
    });

    it("throws an error for invalid URL in URL parameters", async () => {
        const loader = new StoryDataLoader(null, false);

        const locationSpy = vi
            .spyOn(window, "location", "get")
            .mockReturnValue({
                search: "?url=invalid"
            } as any);

        await expect(loader.getBook()).rejects.toThrow(
            "Story URL parameter provided in the page URL is not valid"
        );

        locationSpy.mockRestore();
    });
});
