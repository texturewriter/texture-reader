import containers from "../layout/containers";
import {
    fadeInElement,
    fadeOutElement,
    resizeTextToFit,
    TRIANGLE_CLASS
} from "../services/layout";
import Page from "../page/page";
import type Action from "../actions";
import {
    CURSOR_OFFSET,
    getElementDragOffset,
    getElementFixedPosition
} from "../services/css";

import "./dragManager.css";

// CSS classes
const DRAGGING_CLASS = "dragging";
const DRAG_RETURNING_CLASS = "drag-returning";
const DRAG_ACTION_CONTAINER_CLASS = "in-drag-action";
const NOUN_OVER_CLASS = "over";
const NOUN_HIGHLIGHT_CLASS = "accepts";

// letting the mouse button go before this time after mouse down counts as click instead of drag
const DRAG_TRESHOLD_SECONDS = 0.2;

interface ScreenCoordinates {
    x: number;
    y: number;
}

/**
 * The drag manager handles the drag & drop functionality
 */
class DragManager {
    // The id and element of the currently selected verb
    private verbId: string | null = null;
    private verbElement: HTMLElement | null = null;

    // The id of the noun that's currently being hovered over
    private nounId: string | null = null;

    // Stores the original text of the verb
    private baseVerbText: string = "";

    // The actions available on this page
    private actions: Action[] = [];

    // Stores the verb's original position on the screen, for returning it there when the dragging ends
    private originalVerbPosition = { left: "0px", top: "0px" };

    // How much to offset the verb element when dragging so that the speech bubble triangle points at the cursor
    private verbOffset: ScreenCoordinates = { x: 0, y: 0 };

    // Current pointer coordinates on the screen
    private pointerCoordinates: ScreenCoordinates = { x: 0, y: 0 };

    // Where to snap the verb element when it's on top of a noun
    private snapPosition: ScreenCoordinates | null = null;

    // Timer to store when the drag action started, for calculating if the action is a click or a drag
    private dragStartTime: number = 0;

    // Tracks if something is happening (user is dragging the verb, the action has ended but the verb returning animation is still running)
    private isDraggingActive: boolean = false;

    constructor() {
        // Mouse listeners
        document.addEventListener("mousemove", e =>
            this.updatePointerCoordinates(e)
        );
        document.addEventListener("mouseup", e => this.pointerUpListener(e));

        // Touch control listeners
        document.addEventListener(
            "touchmove",
            e => this.updatePointerCoordinates(e),
            {
                passive: false // allows preventDefault which stops overscrolling on mobile
            }
        );
        document.addEventListener("touchend", e => this.pointerUpListener(e));
    }

    // Is the player currently dragging a verb?
    public get isDragging(): boolean {
        return this.isDraggingActive;
    }

    // Store the mouse or touch control screen coordinates
    public updatePointerCoordinates(e: MouseEvent | TouchEvent) {
        e.preventDefault();

        let clientX = 0;
        let clientY = 0;

        // Have to check if TouchEvent exists, not all (desktop) browsers have it. If it doesn't exist it's not a touch device anyway
        if ("TouchEvent" in window && e instanceof TouchEvent) {
            if (e.touches.length === 0) {
                return;
            }

            const touch = e.touches[0];

            clientX = touch.clientX;
            clientY = touch.clientY;

            this.pointerCoordinates = {
                x: clientX,
                y: clientY
            };

            // Mouseover events don't work on touch devices so we'll detect the nouns here by checking what's under the finger
            const target = document.elementFromPoint(clientX, clientY);

            const isValidNoun =
                target instanceof HTMLElement && // must be a HTML element
                target.dataset.nounId && // must be a noun
                containers.story.contains(target); // must be inside the story container

            if (isValidNoun && target.dataset.nounId !== this.nounId) {
                // entering a new noun element
                this.nounPointerEnter(target.dataset.nounId || "", target);
            } else if (
                this.nounId && // currently tracking a noun
                (!isValidNoun || target.dataset.nounId !== this.nounId) // but now we've moved away from it
            ) {
                this.nounPointerExit(this.nounId);
            }
        } else if (e instanceof MouseEvent) {
            clientX = e.clientX;
            clientY = e.clientY;

            this.pointerCoordinates = {
                x: clientX,
                y: clientY
            };
        }

        // Don't try to move a verb element if one isn't selected.
        // Should still update pointer coordinates before this for when a verb is selected later
        if (!this.verbId || !this.verbElement) {
            return;
        }

        // if the snap position is set use that instead of the actual coordinates
        if (this.snapPosition) {
            this.pointerCoordinates = this.snapPosition;
        }

        this.moveVerbElement();
    }

    // End the drag event when the pointer is released
    private pointerUpListener(e: MouseEvent | TouchEvent) {
        if (
            e instanceof MouseEvent &&
            new Date().getTime() - this.dragStartTime <
                DRAG_TRESHOLD_SECONDS * 1000
        ) {
            // The player let go soon after mousedown so it was a click, not a drag. Don't end the drag event yet.
            return;
        }

        this.endDrag();
    }

    // Start dragging a verb
    public startDrag(verbId: string, verbElement: HTMLElement) {
        if (this.verbId) {
            // if the player is already dragging a verb, first release the old one
            this.endDrag();
        }

        this.isDraggingActive = true;
        this.verbId = verbId;
        this.verbElement = verbElement;
        this.baseVerbText = verbElement.textContent ?? "";

        // store the verb position for returning back to it later
        this.originalVerbPosition = getElementFixedPosition(verbElement);

        // calculate where to position the verb element in relation to the pointer
        this.verbOffset = getElementDragOffset(verbElement);

        // add the CSS class for dragging
        verbElement.classList.remove(DRAG_RETURNING_CLASS);
        verbElement.classList.add(DRAGGING_CLASS);
        verbElement.classList.add(TRIANGLE_CLASS);

        // add the class that hides the cursor while dragging
        containers.theme.classList.add(DRAG_ACTION_CONTAINER_CLASS);

        // store the drag start time for checking if the action is a click or a drag
        this.dragStartTime = new Date().getTime();

        // highlight all nouns that are valid for this verb
        this.actionsForVerb().forEach(({ nounId }) =>
            Page.getNounElement(nounId)?.classList.add(NOUN_HIGHLIGHT_CLASS)
        );

        this.moveVerbElement();
    }

    // End the drag event and check what should happen
    private endDrag() {
        if (!this.verbId || !this.verbElement) {
            // not dragging a verb, do nothing
            return;
        }

        let verbAnimation: "return" | "fadeOut" = "return";

        // DOM cleanup
        const { baseVerbText, verbElement } = this;

        this.removeNounOverClasses();
        this.removeNounHighlightClasses();
        containers.theme.classList.remove(DRAG_ACTION_CONTAINER_CLASS);

        // Figure out what action to do
        if (this.nounId) {
            const action = this.actions.find(action =>
                action.isActionFor(this.verbId as string, this.nounId as string)
            );

            if (action) {
                const behavior = action.getValidBehavior();

                if (behavior) {
                    behavior.execute();

                    // if a behavior was executed, the animation for returning the verb is a fade out/in rather than movement
                    verbAnimation = "fadeOut";
                }
            }
        }
        verbElement.classList.remove(TRIANGLE_CLASS);

        switch (verbAnimation) {
            case "return":
                this.setVerbText(baseVerbText, verbElement); // this must be before changing the classes or text resizing won't work

                // CSS handles the animation
                verbElement.classList.add(DRAG_RETURNING_CLASS);
                verbElement.style.left = this.originalVerbPosition.left;
                verbElement.style.top = this.originalVerbPosition.top;

                // cleanup after the CSS animation has ended
                setTimeout(() => {
                    verbElement.classList.remove(DRAGGING_CLASS);
                    verbElement.classList.remove(DRAG_RETURNING_CLASS);
                    verbElement.style.left = "0px";
                    verbElement.style.top = "0px";

                    // set dragging inactive only if a new drag action hasn't started yet
                    if (!this.verbId) {
                        this.isDraggingActive = false;
                    }
                }, 200);
                break;

            case "fadeOut":
                fadeOutElement(verbElement);

                // move back to correct position and fade back in after the fade out
                setTimeout(() => {
                    verbElement.classList.remove(DRAGGING_CLASS);
                    verbElement.style.left = "0px";
                    verbElement.style.top = "0px";
                    this.setVerbText(baseVerbText, verbElement);
                    fadeInElement(verbElement);

                    if (!this.verbId) {
                        this.isDraggingActive = false;
                    }
                }, 600);
                break;
        }

        // cleanup/zeroing
        this.verbElement = null;
        this.verbId = null;
        this.snapPosition = null;
    }

    // Change the text of the verb and resize the new text to fit
    private setVerbText(text: string, verbElement: HTMLElement | null) {
        if (verbElement) {
            verbElement.textContent = text;
            resizeTextToFit(verbElement);
        }
    }

    // Move the verb element to where the pointer is
    private moveVerbElement() {
        if (!this.verbElement) {
            return;
        }

        this.verbElement.style.left = `${
            this.pointerCoordinates.x - this.verbOffset.x
        }px`;
        this.verbElement.style.top = `${
            this.pointerCoordinates.y - this.verbOffset.y
        }px`;
    }

    // Actions setter
    public setActions(actions: Action[]) {
        this.actions = actions;
    }

    // Find out what actions are available for the current verb
    private actionsForVerb(): Action[] {
        const verbId = this.verbId;

        if (!this.actions || !verbId) {
            return [];
        }

        return this.actions.filter(action => action.isActionFor(verbId));
    }

    // Remove a class from all nouns
    private removeNounClasses(className: string) {
        const elems = containers.story.querySelectorAll(".noun." + className);
        elems.forEach(elem => elem.classList.remove(className));
    }

    // Remove the class that signifies the pointer is on top of a noun
    private removeNounOverClasses() {
        this.removeNounClasses(NOUN_OVER_CLASS);
    }

    // Remove the class that signifies available nouns for the current verb
    private removeNounHighlightClasses() {
        this.removeNounClasses(NOUN_HIGHLIGHT_CLASS);
    }

    // Resolve what text should be on the verb element when it hovers over a valid noun
    private getActionText(
        actionText: string | null | undefined,
        nounText: string
    ) {
        if (!actionText) {
            return this.baseVerbText + " " + nounText;
        }

        return actionText
            .replaceAll("%VERB%", this.baseVerbText)
            .replaceAll("%NOUN%", nounText);
    }

    // Actions for when a verb is moved on top of a noun
    public nounPointerEnter(nounId: string, nounElement: HTMLSpanElement) {
        // CSS cleanup just in case
        this.removeNounOverClasses();

        const verbId = this.verbId;

        if (!verbId) {
            return;
        }

        // find what action to apply
        const action = this.actions.find(action =>
            action.isActionFor(verbId, nounId)
        );

        if (!action) {
            return;
        }

        // snap the verb to place on top of the noun
        const nounRect = nounElement.getBoundingClientRect();
        this.snapPosition = {
            x: nounRect.left + nounRect.width / 2,
            y: nounRect.top + CURSOR_OFFSET
        };

        // change the verb element's text to match the action
        const actionText = this.getActionText(
            action.name,
            nounElement.textContent as string
        );
        this.setVerbText(actionText, this.verbElement);

        // all done, save the noun id and set the CSS class
        this.nounId = nounId;
        nounElement.classList.add("over");
    }

    // Actions for when the verb element leaves the noun
    public nounPointerExit(nounId: string) {
        // remove the classes in any case to avoid them dangling
        this.removeNounOverClasses();

        // don't do anything if not leaving the actually current noun
        if (this.nounId !== nounId) {
            return;
        }

        // set the verb text back to what it was
        this.setVerbText(this.baseVerbText, this.verbElement);

        // cleanup/zeroing
        this.nounId = null;
        this.snapPosition = null;
    }
}

export default new DragManager();
