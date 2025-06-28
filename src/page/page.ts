import { fadeInElement, fadeOutElement } from "../services/layout";
import containers from "../layout/containers";
import type TextureStory from "../story";
import type { PageActionSerialization } from "../actions";
import type { VerbSerialization } from "../verbs";
import type { TextElementSerialization } from "./text";

import nextPageButtonTemplate from "./nextPageButton.template.html?raw";
import restartButtonTemplate from "./restartButton.template.html?raw";

import "./page.css";

export interface PageSerialization {
    id: string;
    actions: PageActionSerialization[];
    category?: "text" | "image" | "title";
    events?: {
        enter?: PageEventSerialization;
        exit?: PageEventWithTimerSerialization;
    };
    imageCaption?: string;
    imageUrl?: string | null;
    name: string;
    nextPage?: string | null;
    subtitle?: string;
    text: TextElementSerialization[];
    title?: string;
    verbs: VerbSerialization[];
}

export interface PageEventSerialization {
    setFlags?: string[];
    unsetFlags?: string[];
}

export interface PageEventWithTimerSerialization
    extends PageEventSerialization {
    timer: {
        count: number | null;
        target: string | null;
    };
}

/**
 * Base class for different page types
 */
abstract class Page {
    protected readonly story: TextureStory;
    protected enterEvent?: PageEventSerialization;
    protected exitEvent?: PageEventWithTimerSerialization;
    private actionCount = 0;

    constructor(story: TextureStory) {
        this.story = story;
    }

    /**
     * The function that creates the HTML elements and displays them
     */
    protected abstract renderPage(): void;

    /**
     * Cleanup function for when the page is removed
     */
    public destructor(): void {
        this.followExitFlagRules();
    }

    /**
     * Shows the next page button. Returns a promise that's resolved when the button is clicked
     */
    private showNextPageButton() {
        fadeOutElement(containers.verbs);

        const actionsElement = containers.actions.querySelector(
            ".next-page-actions"
        ) as HTMLElement;
        actionsElement.innerHTML = nextPageButtonTemplate;
        fadeInElement(actionsElement);

        const buttonElement = actionsElement.querySelector(
            "button.next-page-button"
        );

        return new Promise<void>(resolve => {
            const listener = async () => {
                await fadeOutElement(actionsElement);
                actionsElement.innerHTML = "";
                containers.verbs.innerHTML = "";
                resolve();
                fadeInElement(containers.verbs);
            };

            buttonElement?.addEventListener("click", listener, { once: true });
        });
    }

    /**
     * Creates and shows the restart button on the page
     */
    protected showRestartButton() {
        const actionsElement = containers.actions.querySelector(
            ".next-page-actions"
        ) as HTMLElement;
        actionsElement.innerHTML = restartButtonTemplate;
        fadeInElement(actionsElement);

        const buttonElement = actionsElement.querySelector(
            "button.restart-story-button"
        );

        if (!buttonElement) {
            throw new Error("No restart button element in template");
        }

        const listener = async () => {
            await fadeOutElement(actionsElement);
            containers.verbs.innerHTML = "";
            this.story.restart();
            fadeInElement(containers.verbs);
        };

        buttonElement.addEventListener("click", listener, { once: true });
    }

    /**
     * After each action, increment the action count if the page has a rule to move on to the next page after N actions
     */
    public incrementActionCount() {
        this.actionCount++;

        const timerTarget = this.exitEvent?.timer?.target;

        if (timerTarget && this.actionCount === this.exitEvent?.timer?.count) {
            this.story.openPage(timerTarget, false);
        }
    }

    /**
     * Follow the flag rules of the page's enter event
     */
    private followEnterFlagRules() {
        if (this.enterEvent) {
            this.story.flags.toggleFlagsFromRules(this.enterEvent);
        }
    }

    /**
     * Follow the flag rules of the page's exit event
     */
    private followExitFlagRules() {
        if (this.exitEvent) {
            this.story.flags.toggleFlagsFromRules(this.exitEvent);
        }
    }

    /**
     * Query a noun element that corresponds to a noun id
     */
    public static getNounElement(nounId: string): HTMLElement | null {
        return containers.story.querySelector(
            `span.noun[data-noun-id="${nounId}"]`
        );
    }

    /**
     * Start the sequence for closing the previous page and showing this page
     */
    public async show(immediately = true) {
        // unless it's requested to show the new page immediately, show a next page button on the previous page and wait until it's clicked
        if (!immediately) {
            await this.showNextPageButton();
        }

        // if the previous page is still shown (has the fade-in class) then fade it out first
        if (containers.theme.classList.contains("fade-in")) {
            await fadeOutElement(containers.theme);
        }

        // toggle flags according to this page's enter event rules
        this.followEnterFlagRules();

        // render the new page
        this.renderPage();

        // fade everything back in
        await fadeInElement(containers.theme);
    }
}

export default Page;
