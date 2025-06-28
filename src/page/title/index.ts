import Action from "../../actions";
import dragManager from "../../interaction/dragManager";
import {
    fadeInElement,
    newContentToDomNodes,
    processStoryTextContent
} from "../../services/layout";
import type TextureStory from "../../story";
import Page from "../page";
import PageVerbs from "../../verbs";
import containers from "../../layout/containers";
import InteractionTutorial from "../../interaction/tutorial";

import template from "./titlePage.template.html?raw";

import "./titlePage.css";

const START_STORY_VERB_ID = "start-verb";
const START_STORY_NOUN_ID = "start-noun";
const NOUN_CLASS = "noun";

export interface TitlePageSerialization {
    author?: string;
    enabled?: boolean;
    subtitle?: string;
    verb?: string;
}

/**
 * The title page shows the basic story info and acts as a tutorial for how the interaction works
 */
class TitlePage extends Page {
    private readonly startpage: string;
    private readonly subtitleSpan: HTMLSpanElement;
    private readonly title: string;
    private readonly verb?: string;

    // stores a reference to the timer that starts the tutorial
    private tutorialTimer?: ReturnType<typeof setTimeout>;

    constructor(
        story: TextureStory,
        startpage: string,
        title: string,
        subtitle?: string,
        author?: string,
        verb?: string
    ) {
        super(story);

        this.startpage = startpage;
        this.title = title;
        this.verb = verb;

        // the subtitle is built from parts if a specific subtitle hasn't been given
        this.subtitleSpan = this.getSubtitleElement(subtitle, author);
    }

    public destructor() {
        super.destructor();
        clearTimeout(this.tutorialTimer);
    }

    // Listeners for dragging the verb over the noun.
    // There's only one noun so it can be passed as a constant.
    private nounMouseOverListener(span: HTMLSpanElement) {
        dragManager.nounPointerEnter(START_STORY_NOUN_ID, span);
    }

    private nounMouseOutListener() {
        dragManager.nounPointerExit(START_STORY_NOUN_ID);
    }

    // Create the subtitle element and its contents
    private getSubtitleElement(
        subtitle?: string,
        author?: string
    ): HTMLSpanElement {
        const text = subtitle || `A [story] by ${author || "Anonymous"}`;

        const span = document.createElement("span");
        span.textContent = processStoryTextContent(text);
        span.dataset.nounId = START_STORY_NOUN_ID;
        span.classList.add(NOUN_CLASS);

        span.addEventListener("mouseover", () =>
            this.nounMouseOverListener(span)
        );
        span.addEventListener("mouseout", () => this.nounMouseOutListener());

        const element = newContentToDomNodes(text, span);

        return element;
    }

    // Create and populate the elements from the template
    protected renderPage() {
        containers.story.innerHTML = template;

        const titleElement = containers.story.querySelector(
            ".titlepage-title"
        ) as HTMLElement;
        const subtitleElement = containers.story.querySelector(
            ".titlepage-subtitle"
        ) as HTMLElement;

        titleElement.textContent = this.title;
        subtitleElement.appendChild(this.subtitleSpan);
        fadeInElement(containers.story);

        // utilise the "normal" engine for game mechanics to make the "play" verb and "start" noun
        const verbs = new PageVerbs([
            { id: START_STORY_VERB_ID, name: this.verb || "play" }
        ]);
        verbs.show(containers.verbs);

        dragManager.setActions([
            new Action(this.story, {
                behaviors: [
                    {
                        name: "Start story",
                        turnTo: { page: this.startpage, immediately: true }
                    }
                ],
                noun: START_STORY_NOUN_ID,
                verb: START_STORY_VERB_ID
            })
        ]);

        this.tutorialSetup();
    }

    // prepares the tutorial for presenting when needed
    private tutorialSetup() {
        const verbElement = containers.verbs.querySelector(
            ".verb-cell"
        ) as HTMLElement;
        const nounElement = Page.getNounElement(START_STORY_NOUN_ID);

        if (!verbElement || !nounElement) {
            throw new Error("No elements for tutorial found");
        }

        let tutorialReady = true;
        let shownCount = 0;
        let tutorial: InteractionTutorial | null = null;

        const listener = () => {
            clearTimeout(this.tutorialTimer);

            // if the tutorial is already running, hide it because the player has started doing something
            if (tutorial && !tutorialReady) {
                tutorial.hide();
                return;
            }

            this.tutorialTimer = setTimeout(async () => {
                // start the tutorial only if the player is not already dragging the verb
                if (tutorialReady && !dragManager.isDragging) {
                    tutorialReady = false;
                    shownCount++; // count how many times the tutorial has been shown, if more than once, show the explicit instructions as well
                    tutorial = new InteractionTutorial(
                        verbElement,
                        nounElement
                    );
                    await tutorial.show(shownCount > 1);
                    tutorial = null;
                    tutorialReady = true;
                }
            }, 2000);
        };

        verbElement.addEventListener("mousedown", listener);
        verbElement.addEventListener("touchstart", listener);
    }
}

export default TitlePage;
