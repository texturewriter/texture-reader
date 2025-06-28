import { resolveStoryContainer } from "../services/layout";
import { setTheme, type TextureTheme } from "../layout/theme";
import containers from "../layout/containers";
import CoverPage from "../cover";
import ImagePage from "../page/image";
import StoryFlags from "../flags";
import TextPage from "../page/text";
import TitlePage from "../page/title";
import type { PageSerialization } from "../page/page";
import type { TitlePageSerialization } from "../page/title";
import type Page from "../page/page";

import layoutTemplate from "../layout/layout.template.html?raw";
import StoryDataLoader from "./loader";

// The maximum story format version that this reader can handle
const CURRENT_STORY_FORMAT_VERSION = 2;

export interface TextureConfig {
    coverUrl?: string;
    disableUrlOptions?: boolean;
    fromPage?: number;
    showTitlePage?: boolean;
    storyContainer?: HTMLElement | string;
    themeContainer?: HTMLElement | string;
}

export interface BookSerialization {
    author?: string;
    blurb?: string;
    cover?: TitlePageSerialization; // this field is misnamed due to historical reasons
    created?: string | number;
    genres?: string[];
    hasCoverImage?: boolean;
    id?: string;
    ifid?: string;
    library?: string | null;
    media?: {
        [key in string]: {
            medium: string;
            original: string;
            thumbnail: string;
        };
    };
    modified?: string | number;
    name: string;
    pages: PageSerialization[];
    progressIndicator?: "none"; // deprecated
    public?: boolean;
    savefile: number;
    startpage: string;
    theme?: TextureTheme;
    user?: string;
}

/**
 * The main class for the story data and the top-level actions (loading story data, starting the story etc)
 */
class TextureStory {
    // either the book data or a URL to it
    private bookInitializer: BookSerialization | string | null;

    // the serialization of the story in the story format JSON
    private bookSerialization: BookSerialization | null = null;

    // the configuration object passed at initialization
    private readonly config: TextureConfig;

    // story flags
    public readonly flags: StoryFlags;

    // current page
    private page: Page | null = null;

    constructor(
        book: BookSerialization | string | null,
        config?: TextureConfig
    ) {
        this.bookInitializer = book;
        this.config = config ?? {};
        this.flags = new StoryFlags();
    }

    // getter for the book serialization
    private get book() {
        if (!this.bookSerialization) {
            throw new Error("Tried to access story book before it exists");
        }

        return this.bookSerialization;
    }

    /**
     * Checks that the book serialization structure is valid and a version that this reader can handle
     */
    private validateBook() {
        // The field in the book for story format version is called "savefile"
        if (typeof this.book.savefile !== "number") {
            throw new Error("The story file doesn't specify savefile version");
        } else if (this.book.savefile < 2) {
            // version 1 has never existed publicly
            throw new Error(
                `Invalid story file savefile version ${this.book.savefile}, must be 2 or larger`
            );
        } else if (this.book.savefile > CURRENT_STORY_FORMAT_VERSION) {
            throw new Error(
                `Story file savefile version is ${this.book.savefile}. This reader supports versions up to ${CURRENT_STORY_FORMAT_VERSION}.`
            );
        }

        if (!this.book.name) {
            throw new Error("The story doesn't have a name field");
        }

        if (!Array.isArray(this.book.pages) || this.book.pages.length === 0) {
            throw new Error("The story has no pages");
        }

        if (!this.book.startpage) {
            throw new Error("The story doesn't specify start page");
        }
    }

    /**
     * Start the story
     */
    public async start() {
        const storyDataLoader = new StoryDataLoader(
            this.bookInitializer,
            this.config.disableUrlOptions
        );
        this.bookSerialization = await storyDataLoader.getBook();
        this.validateBook();

        const { coverUrl, showTitlePage, storyContainer, themeContainer } =
            this.config;

        // Create the main HTML structure
        const containerElement = resolveStoryContainer(storyContainer);
        const finalThemeContainer = themeContainer || document.body;
        containers.initLayoutTemplate(layoutTemplate, containerElement);

        // Set the visual theme
        setTheme(this.book.theme, finalThemeContainer);

        // Browser window title
        document.title = this.book.name;

        // for testing read the cover from the URL
        const coverLocation =
            coverUrl ??
            new URLSearchParams(window.location.search).get("cover");

        // If the cover URL is set, show the cover page
        if (coverLocation) {
            const cover = new CoverPage(coverLocation);
            await cover.show();
        }

        this.restart(
            this.book.startpage,
            showTitlePage !== false, // this makes the default value true if the option is omitted
            this.book.cover
        );
    }

    /**
     * Open a new page of the story
     */
    public openPage(pageId: string, immediately = true) {
        const book = this.book;

        if (!book) {
            throw new Error("Can't open a page when book hasn't been set");
        }

        const serializedPage = book.pages.find(page => page.id === pageId);

        if (!serializedPage) {
            throw new Error("Unknown page id " + pageId);
        }

        if (this.page) {
            this.page.destructor();
        }

        if (
            !serializedPage.category || // text page is the default type, use this if nothing else is specified
            serializedPage.category === "text"
        ) {
            this.page = new TextPage(this, serializedPage);
        } else if (serializedPage.category === "image") {
            this.page = new ImagePage(this, serializedPage);
        } else {
            throw new Error("Unknown page category " + serializedPage.category);
        }

        this.page.show(immediately);
    }

    /**
     * Restart the story
     */
    public restart = async (
        pageId?: string | null,
        showTitlePage = false,
        title?: TitlePageSerialization
    ) => {
        if (!this.bookSerialization) {
            throw new Error("Cannot restart a story that hasn't been started");
        }

        const id = pageId || this.book.startpage;

        if (!id) {
            throw new Error(
                "Tried to restart a story but no start page provided"
            );
        }

        // the page is set properly later
        this.page = null;

        // The title page is shown only if requested and when it's enabled in the story.
        // When restarting at the end of the story, no need to show the title page again.
        if (showTitlePage && title?.enabled) {
            this.page = new TitlePage(
                this,
                id,
                this.book.name,
                title.subtitle,
                title.author,
                title.verb
            );
            await this.page.show();
        } else {
            this.openPage(id);
        }
    };

    /**
     * Increment the page's action count
     */
    public incrementActionCount() {
        if (this.page) {
            this.page.incrementActionCount();
        }
    }
}

export default TextureStory;
