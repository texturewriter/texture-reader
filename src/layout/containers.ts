import { resizeTextToFit } from "../services/layout";

/**
 * The DOM elements for different parts of the story, for convenient access
 */
class ContainerElements {
    private actionsContainer: HTMLElement | null = null;
    private storyContainer: HTMLElement | null = null;
    private themeContainer: HTMLElement | null = null;
    private verbsContainer: HTMLElement | null = null;

    constructor() {
        window.addEventListener("resize", () => this.resizeStoryText());
    }

    /**
     * Insert the template HTML into the DOM and populate the element fields
     */
    public initLayoutTemplate(template: string, container: HTMLElement) {
        container.innerHTML = template;
        container.classList.add("texture-container");
        this.actionsContainer = container.querySelector(".actions");
        this.storyContainer = container.querySelector(".story");
        this.verbsContainer = container.querySelector(".verbs");

        if (!this.storyContainer || !this.verbsContainer) {
            throw new Error(
                "Container template doesn't contain either .story or .verbs elements (or neither)"
            );
        }
    }

    /**
     * Set the theme container (the topmost element where theme CSS classes are applied)
     */
    public setThemeContainer(themeContainer: HTMLElement) {
        this.themeContainer = themeContainer;
    }

    // getters for the containers
    public get actions(): HTMLElement {
        if (!this.actionsContainer) {
            throw new Error("Actions container not set");
        }

        return this.actionsContainer;
    }

    public get story(): HTMLElement {
        if (!this.storyContainer) {
            throw new Error("Story container not set");
        }

        return this.storyContainer;
    }

    public get theme(): HTMLElement {
        if (!this.themeContainer) {
            throw new Error("Theme container not set");
        }

        return this.themeContainer;
    }

    public get verbs(): HTMLElement {
        if (!this.verbsContainer) {
            throw new Error("Verbs container not set");
        }

        return this.verbsContainer;
    }

    /**
     * Resize the story text font to fit the viewport
     */
    public resizeStoryText() {
        if (!this.storyContainer || !this.verbsContainer) {
            return;
        }

        const top = this.storyContainer.getBoundingClientRect().top;
        const bottom = this.verbsContainer.getBoundingClientRect().top;

        // the target height is the actual distance between the top of the story container and
        // where the verb container starts, minus the top margin again to leave the same margin at the bottom
        resizeTextToFit(this.storyContainer, bottom - top * 2);
    }

    // this is only for unit tests
    // @internal
    public reset() {
        this.actionsContainer = null;
        this.storyContainer = null;
        this.themeContainer = null;
        this.verbsContainer = null;
    }
}

export default new ContainerElements();
