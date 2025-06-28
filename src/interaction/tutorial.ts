import containers from "../layout/containers";
import { getElementDragOffset, getElementFixedPosition } from "../services/css";
import { pause } from "../services/async";
import {
    fadeInElement,
    fadeOutElement,
    TRIANGLE_CLASS
} from "../services/layout";

import dragIcon from "./dragIcon.svg";
import dragIconHold from "./dragIconHold.svg";
import template from "./tutorial.template.html?raw";

import "./tutorial.css";

/**
 * The instructions on the title page that demonstrate how to interact with the story
 */
class InteractionTutorial {
    private readonly nounElement: HTMLElement;
    private readonly verbElement: HTMLElement;
    private tutorialContainer: HTMLDivElement | null = null;

    constructor(verbElement: HTMLElement, nounElement: HTMLElement) {
        this.verbElement = verbElement;
        this.nounElement = nounElement;
    }

    /**
     * Start the tutorial sequence
     */
    public async show(withInstructions: boolean) {
        const templateContainer = document.createElement("div");
        templateContainer.innerHTML = template;

        // the root container for the entire tutorial
        this.tutorialContainer = templateContainer.querySelector(
            ".texture-tutorial"
        ) as HTMLDivElement;

        // the part that has the interaction animation (verb box and hand icon)
        const interactionDemoContainer = templateContainer.querySelector(
            ".interaction-demo"
        ) as HTMLElement;

        // the <img> element for the hand icon
        const dragIconImg = interactionDemoContainer?.querySelector(
            "img.drag-icon"
        ) as HTMLImageElement;

        if (
            !this.tutorialContainer ||
            !interactionDemoContainer ||
            !dragIconImg
        ) {
            throw new Error("Tutorial containers not found");
        }

        // create a "ghost" of the actual verb that the tutorial uses to demonstrate the drag and drop action
        const ghostVerb = this.verbElement.cloneNode(true) as HTMLElement;
        delete ghostVerb.dataset.verbId;
        ghostVerb.classList.add("ghost");
        ghostVerb.classList.add(TRIANGLE_CLASS);
        interactionDemoContainer.append(ghostVerb);

        // start with a "neutral" drag icon that represents hovering over the screen
        dragIconImg.src = dragIcon;

        // put the tutorial in the DOM
        containers.verbs.appendChild(this.tutorialContainer);

        // calculate where to put the container so that the ghost verb is exactly under the real verb
        const { left: verbLeft, top: verbTop } = getElementFixedPosition(
            this.verbElement
        );
        interactionDemoContainer.style.left = verbLeft;
        interactionDemoContainer.style.top = verbTop;

        // calculate where to put the drag icon so that it points at the ghost verb's triangle part
        const dragOffset = getElementDragOffset(this.verbElement);
        const iconOffset = dragOffset.y / 3;
        dragIconImg.style.left = `${iconOffset}px`;
        dragIconImg.style.top = `${iconOffset}px`;

        ghostVerb.style.left = `${-dragOffset.x + iconOffset + 18}px`;
        ghostVerb.style.top = `${-iconOffset * 2}px`;

        dragIconImg.classList.add("appear");

        // find the element that contains the more explicit instructions
        const instructionsPopup = this.tutorialContainer.querySelector(
            ".how-to-play"
        ) as HTMLElement;

        // if it was requested to show the instructions popup, do it here
        if (instructionsPopup && withInstructions) {
            const instructionsVerb =
                instructionsPopup.querySelector(".hint-verb-name");
            const instructionsNoun =
                instructionsPopup.querySelector(".hint-noun-name");

            // change the popup content so that it uses the actual verb and noun names that the title page has
            if (instructionsVerb && instructionsNoun) {
                instructionsVerb.textContent = this.verbElement.textContent;
                instructionsNoun.textContent = this.nounElement.textContent;
            }

            // calculate where to put the popup so that it points at the verb
            const rect = instructionsPopup.getBoundingClientRect();
            const popupLeft = parseFloat(verbLeft) + dragOffset.x + iconOffset;

            instructionsPopup.style.top = `${
                parseFloat(verbTop) - rect.height
            }px`;

            // if the popup goes off screen, set it relative to the right side instead
            if (popupLeft + rect.width < window.innerWidth) {
                instructionsPopup.style.left = `${
                    parseFloat(verbLeft) + dragOffset.x + iconOffset
                }px`;
            } else {
                instructionsPopup.style.left = "auto";
                instructionsPopup.style.right = "10px";
            }

            // show the popup
            fadeInElement(instructionsPopup);
        }

        // start the dragging demo animation
        await pause(0.5);

        // change the icon to represent holding the pointer down and move it slightly down to signify the action
        dragIconImg.src = dragIconHold;
        dragIconImg.style.top = `${iconOffset + 3}px`;
        await pause(1);

        // Change the container position to match the noun coordinates. The movement animation is handled in CSS
        const { left: nounLeft, top: nounTop } = getElementFixedPosition(
            this.nounElement
        );
        interactionDemoContainer.style.left = nounLeft;
        interactionDemoContainer.style.top = nounTop;

        // the animated class in the container makes it move to the new coordinates
        interactionDemoContainer.classList.add("animated");

        // the animated class in the verb makes it fade in
        ghostVerb.classList.add("animated");
        this.nounElement.classList.add("accepts");

        // wait until the animation finishes
        await pause(1.5);

        // reverse the hold down animation to signify letting go
        dragIconImg.src = dragIcon;
        dragIconImg.style.top = `${iconOffset}px`;

        // fade out the ghost verb and the pointer icon
        await fadeOutElement(interactionDemoContainer);

        // if the instruction popup is visible, wait a bit longer before closing the tutorial so that the player has time to read the instructions
        if (withInstructions) {
            await pause(5);
        }

        // all done, hide the tutorial
        await this.hide();
    }

    /**
     * Hide the tutorial
     */
    public async hide() {
        if (!this.tutorialContainer) {
            return;
        }

        await fadeOutElement(this.tutorialContainer);

        // this function may have been called again while awaiting the fadeout so the container might not exist anymore
        if (this.tutorialContainer) {
            this.tutorialContainer.remove();
        }

        this.tutorialContainer = null;
    }
}

export default InteractionTutorial;
