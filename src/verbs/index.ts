import dragManager from "../interaction/dragManager";
import { resizeTextToFit } from "../services/layout";

export interface VerbSerialization {
    id: string;
    name: string;
}

/**
 * The set of verbs shown on the page
 */
class PageVerbs {
    private verbs: VerbSerialization[];

    constructor(verbs: VerbSerialization[]) {
        this.verbs = verbs;
    }

    public show(parent: HTMLElement) {
        parent.innerHTML = "";

        this.verbs.forEach(verb => {
            const verbElem = document.createElement("div");
            verbElem.classList.add("verb");
            verbElem.textContent = verb.name;

            const clickListener = (e: MouseEvent | TouchEvent) => {
                // must trigger the mouse move listener here to update mouse coordinates,
                // in case the player put the cursor here without moving the mouse (mainly touch devices)
                dragManager.updatePointerCoordinates(e);
                this.verbMouseDownListener(verb.id, verbElem);
            };

            verbElem.addEventListener("mousedown", clickListener);
            verbElem.addEventListener("touchstart", clickListener);

            const cell = document.createElement("div");
            cell.dataset.verbId = verb.id;
            cell.classList.add("verb-cell");

            cell.appendChild(verbElem);
            parent.appendChild(cell);
            resizeTextToFit(verbElem);
        });
    }

    private verbMouseDownListener(verbId: string, verbElement: HTMLElement) {
        dragManager.startDrag(verbId, verbElement);
    }
}

export default PageVerbs;
