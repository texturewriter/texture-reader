import containers from "../../layout/containers";
import dragManager from "../../interaction/dragManager";
import Page from "../page";
import PageVerbs from "../../verbs";
import Action from "../../actions";
import { processStoryTextContent } from "../../services/layout";
import type { PageSerialization } from "../page";
import type { VerbSerialization } from "../../verbs";
import type TextureStory from "../../story";

interface TextHtmlElementSerialization {
    elem: "p" | "br";
}

interface TextSpanSerialization {
    id?: string;
    elem?: "b" | "i" | "span";
    text: string | TextElementSerialization[];
}

export type TextElementSerialization =
    | TextHtmlElementSerialization
    | TextSpanSerialization;

/**
 * The default content page type, text with verbs to interact with it
 */
class TextPage extends Page {
    private actions: Action[];
    private text: TextElementSerialization[];
    private verbs: VerbSerialization[];

    constructor(story: TextureStory, page: PageSerialization) {
        super(story);

        this.text = page.text;
        this.verbs = page.verbs;
        this.actions = page.actions.map(action => new Action(story, action));
        this.enterEvent = page.events?.enter;
        this.exitEvent = page.events?.exit;
    }

    protected renderPage() {
        const parent = containers.story;
        parent.innerHTML = "";

        let paragraph: HTMLParagraphElement = document.createElement("p");

        // parse each segment of the contents
        this.text.forEach(
            (segment, index) =>
                (paragraph = this.handleSegmentElement(
                    segment,
                    parent,
                    index === 0,
                    paragraph
                ))
        );

        // if we have a paragraph left over that's not yet added to the page, do it now
        if (paragraph.childElementCount > 0) {
            parent.appendChild(paragraph);
        }

        // create the verbs
        const verbs = new PageVerbs(this.verbs);

        if (this.verbs.length > 0) {
            verbs.show(containers.verbs);
            dragManager.setActions(this.actions);
        } else {
            containers.verbs.innerHTML = "";

            // no verbs means the story has ended
            this.showRestartButton();
        }

        // when the page has been built, resize the text to fit
        containers.resizeStoryText();
    }

    // Parses individual page segments and turns them into DOM elements
    private handleSegmentElement(
        segment: TextElementSerialization,
        parent: HTMLElement,
        isFirst: boolean,
        paragraph: HTMLParagraphElement
    ): HTMLParagraphElement {
        if (segment.elem) {
            switch (segment.elem) {
                case "p":
                    if (isFirst) {
                        // first P is superfluous because we already enforce it
                        return paragraph;
                    }

                    parent.appendChild(paragraph);
                    paragraph = document.createElement("p");
                    break;

                case "br":
                    paragraph.appendChild(document.createElement("br"));
                    break;

                case "b":
                case "i":
                case "span":
                    const span = document.createElement(segment.elem);

                    if (Array.isArray(segment.text)) {
                        // this is technically invalid but there are existing stories with this structure
                        segment.text.forEach(s => {
                            paragraph = this.handleSegmentElement(
                                s,
                                span,
                                false,
                                paragraph
                            );
                        });
                    } else {
                        span.textContent =
                            "text" in segment
                                ? processStoryTextContent(segment.text)
                                : "";
                    }

                    // if an id is present it means this is an actionable noun
                    if ("id" in segment && segment.id) {
                        span.dataset.nounId = segment.id;
                        span.classList.add("noun");
                        span.addEventListener("mouseover", () =>
                            this.nounMouseOverListener(
                                segment.id as string,
                                span
                            )
                        );
                        span.addEventListener("mouseout", () =>
                            this.nounMouseOutListener(segment.id as string)
                        );
                    }

                    paragraph.appendChild(span);
                    break;

                default:
                    throw new Error(
                        "Found a page segment with an invalid elem " +
                            segment.elem
                    );
            }
        } else if (typeof segment.text === "string") {
            // if no element is specified, append the text as a plain text node
            paragraph.append(segment.text);
        }

        return paragraph;
    }

    // Listeners for the pointer entering and exiting a noun
    private nounMouseOverListener(nounId: string, element: HTMLSpanElement) {
        dragManager.nounPointerEnter(nounId, element);
    }

    private nounMouseOutListener(nounId: string) {
        dragManager.nounPointerExit(nounId);
    }
}

export default TextPage;
