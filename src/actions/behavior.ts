import {
    fadeInElement,
    fadeOutElement,
    newContentToDomNodes
} from "../services/layout";
import containers from "../layout/containers";
import Page from "../page/page";
import type Action from ".";
import type TextureStory from "../story";

export interface ActionBehaviorSerialization {
    changeNoun?: string;
    condition?: BehaviorConditionalSerialization;
    name: string;
    newParagraph?: {
        placement: "after" | "end" | "replace";
        text: string;
    };
    setFlags?: string[] | "";
    turnTo?:
        | string
        | {
              immediately?: boolean;
              page?: string;
          };
    unsetFlags?: string[] | "";
}

interface BehaviorConditionalSerialization {
    connective: "and" | "or";
    setFlags: string[];
    unsetFlags: string[];
}

/**
 * Individual rules that tell what a verb + noun combination does.
 * An action can have multiple behaviors, they're evaluated from top to bottom and the first that is valid will be applied.
 */
class ActionBehavior {
    // Reference to the main story object
    private readonly story: TextureStory;

    // The parent action
    private readonly action: Action;

    // The serialization of this behavior
    private readonly behavior: ActionBehaviorSerialization;

    // The last behavior is the default one. It's the only one that applies even if it has no conditions
    public readonly isDefault: boolean;

    constructor(
        story: TextureStory,
        behavior: ActionBehaviorSerialization,
        action: Action,
        isDefault: boolean
    ) {
        this.story = story;
        this.behavior = behavior;
        this.action = action;
        this.isDefault = isDefault;
    }

    // The rules for when this behavior applies
    public get condition() {
        return this.behavior.condition;
    }

    // For debugging and testing
    public get name() {
        return this.behavior.name;
    }

    // Apply this behavior
    public execute(): Promise<void> {
        const behavior = this.behavior;
        const nounElement = Page.getNounElement(this.action.nounId);

        // Store async results of the behavior so that they can be returned and awaited by the caller
        const asyncOperations: Promise<void> = Promise.resolve();

        // Actions can only be used once per page visit
        this.action.disable();

        if (!nounElement) {
            // this should never happen
            throw new Error(
                "Noun element not found for action " + this.action.name
            );
        }

        // Increment the counter for the "after N actions" page exit condition
        this.story.incrementActionCount();

        if (typeof behavior.newParagraph?.text === "string") {
            const currentParagraphElement = nounElement.closest("p");

            if (!currentParagraphElement) {
                throw new Error("The noun is not inside a paragraph");
            }

            // Create the new paragraph
            const newParagraphElement = document.createElement("p");

            // If the new paragraph has a [bracketed] word, replace it with this noun
            const newContent = newContentToDomNodes(
                behavior.newParagraph.text,
                nounElement
            );
            newParagraphElement.appendChild(newContent);

            switch (behavior.newParagraph.placement) {
                // After this paragraph
                case "after":
                    currentParagraphElement.after(newParagraphElement);
                    asyncOperations.then(() =>
                        fadeInElement(newParagraphElement)
                    );
                    break;

                // At the end of the page
                case "end":
                    containers.story.appendChild(newParagraphElement);
                    asyncOperations.then(() =>
                        fadeInElement(newParagraphElement)
                    );
                    break;

                // Replace the paragraph where the noun was in
                case "replace":
                    asyncOperations
                        .then(() => fadeOutElement(currentParagraphElement))
                        .then(() => {
                            currentParagraphElement.textContent =
                                behavior.newParagraph?.text ?? "";
                            containers.resizeStoryText();
                            return fadeInElement(currentParagraphElement);
                        });
                    break;

                default:
                    throw new Error(
                        "Unknown paragraph placement " +
                            behavior.newParagraph.placement
                    );
            }
        }

        const newNounText = behavior.changeNoun;

        // Changing the noun text
        if (typeof newNounText === "string") {
            asyncOperations
                .then(() => fadeOutElement(nounElement))
                .then(() => {
                    const nounParent = nounElement.parentNode;

                    if (!nounParent) {
                        throw new Error("Noun has no parent node");
                    }

                    // Storing all these beforehand is needed because the noun placement changes with newContentToDomNodes
                    const nounIndex = Array.from(nounParent.children).indexOf(
                        nounElement
                    );
                    const newSpan = newContentToDomNodes(
                        newNounText,
                        nounElement
                    );
                    nounParent.replaceChild(
                        newSpan,
                        nounParent.children[nounIndex]
                    );
                    containers.resizeStoryText();
                    return fadeInElement(newSpan);
                });
        }

        // Turn to a new page
        if (behavior.turnTo) {
            const newPageId =
                typeof behavior.turnTo === "string"
                    ? behavior.turnTo
                    : behavior.turnTo.page;
            const immediately =
                typeof behavior.turnTo === "object" &&
                behavior.turnTo.immediately;

            if (newPageId) {
                this.story.openPage(newPageId, immediately);
            }
        }

        // Follow the behavior's rules for setting and unsetting flags
        if (Array.isArray(behavior.setFlags)) {
            this.story.flags.setAll(behavior.setFlags);
        }

        if (Array.isArray(behavior.unsetFlags)) {
            this.story.flags.unsetAll(behavior.unsetFlags);
        }

        // Behavior operations may have changed the shape of the page text
        containers.resizeStoryText();

        return asyncOperations;
    }
}

export default ActionBehavior;
