import type { BookSerialization } from "../story";

/**
 * Handles loading the story data depending on how it was passed to the reader (JSON, URL or object)
 */
class StoryDataLoader {
    private readonly disableUrlOptions: boolean;
    private story: BookSerialization | null = null;
    private readonly url: string | null = null;

    constructor(
        storyOrUrl: BookSerialization | string | null | undefined,
        disableUrlOptions = false
    ) {
        this.disableUrlOptions = disableUrlOptions;

        // if the parameter is a URL, store it as such and prepare for fetching it
        if (this.isUrl(storyOrUrl)) {
            this.url = storyOrUrl as string;
            return;
        }

        // if the parameter is a string but not a URL, handle it as a JSON string
        if (typeof storyOrUrl === "string") {
            this.story = this.parseStoryJSON(storyOrUrl);
            return;
        }

        // if nothing is passed and URL options are disabled, throw an error
        if (!storyOrUrl && this.disableUrlOptions) {
            throw new Error(
                "No story provided and fetching story from the URL is disabled"
            );
        }

        // otherwise it's already a story object
        this.story = storyOrUrl as BookSerialization;
    }

    public getBook(): BookSerialization | Promise<BookSerialization> {
        if (this.story) {
            return this.story;
        }

        return this.fetchBook();
    }

    /**
     * Check if a value is an acceptable URL
     */
    private isUrl(storyOrUrl: BookSerialization | string | null | undefined) {
        if (typeof storyOrUrl !== "string") {
            return false;
        }

        return (
            storyOrUrl.startsWith("http") ||
            storyOrUrl.startsWith("/") ||
            storyOrUrl.startsWith("./")
        );
    }

    private parseStoryJSON(json: string): BookSerialization {
        // quick sanity check: the expected JSON string always encodes an object
        if (
            !json.trimStart().startsWith("{") ||
            !json.trimEnd().endsWith("}")
        ) {
            throw new Error("Story data is not a valid story JSON string");
        }

        try {
            const story: BookSerialization = JSON.parse(json);
            return story;
        } catch (e) {
            throw new Error("Invalid JSON story data");
        }
    }

    /**
     * Fetch the story data from a URL
     */
    private async fetchBook(): Promise<BookSerialization> {
        let url = this.url;

        if (!this.url) {
            // this should have been checked in the constructor but check once more just in case
            if (this.disableUrlOptions) {
                throw new Error(
                    "No story provided and fetching story from the URL is disabled"
                );
            }

            url = new URLSearchParams(window.location.search).get("url");
        }

        if (!url) {
            throw new Error("No story provided in config or URL");
        }

        if (!this.isUrl(url)) {
            throw new Error(
                "Story URL parameter provided in the page URL is not valid"
            );
        }

        let response: Response;

        try {
            response = await fetch(url);
        } catch (e) {
            console.error(e);
            throw new Error("Could not fetch story file from " + url);
        }

        if (!response.ok) {
            throw new Error(
                `HTTP error ${response.status}: ${response.statusText}`
            );
        }

        try {
            return response.json() as Promise<BookSerialization>;
        } catch (e) {
            throw new Error("Invalid JSON file");
        }
    }
}

export default StoryDataLoader;
