import Page, { type PageSerialization } from "../page";
import containers from "../../layout/containers";
import { urlToCssBackgroundUrl } from "../../services/css";
import type TextureStory from "../../story";

import template from "./imagePage.template.html?raw";

import "./imagePage.css";

/**
 * A page that consists of an image and optionally a caption, a title and a subtitle.
 * Clicking the image brings the player to the next page, or if there is no next page, the story ends here.
 */
class ImagePage extends Page {
    private readonly caption?: string;
    private readonly imageUrl: string;
    private readonly nextPage?: string | null;
    private readonly subtitle?: string;
    private readonly title?: string;

    constructor(story: TextureStory, source: PageSerialization) {
        super(story);

        this.imageUrl = source.imageUrl || "";
        this.caption = source.imageCaption;
        this.enterEvent = source.events?.enter;
        this.exitEvent = source.events?.exit;
        this.nextPage = source.nextPage;
        this.subtitle = source.subtitle;
        this.title = source.title;
    }

    protected renderPage() {
        containers.story.innerHTML = template;

        const imagePageElement = containers.story.querySelector(
            ".image-page"
        ) as HTMLElement;
        const titleElement = containers.story.querySelector(
            ".title-text"
        ) as HTMLElement;
        const subtitleElement = containers.story.querySelector(
            ".subtitle-text"
        ) as HTMLElement;
        const imageElement = containers.story.querySelector(
            ".illustration-image"
        ) as HTMLElement;
        const captionElement = containers.story.querySelector(
            ".illustration-caption"
        ) as HTMLElement;

        if (
            !imagePageElement ||
            !titleElement ||
            !subtitleElement ||
            !imageElement ||
            !captionElement
        ) {
            throw new Error(
                "Image page template doesn't contain all the expected elements"
            );
        }

        // The image is a background instead of an <img> element because a background is easier to fit to the page without having to set the dimensions manually
        imageElement.style.backgroundImage = urlToCssBackgroundUrl(
            this.imageUrl
        );

        // Set the optional elements or hide them if they haven't been given
        if (this.title) {
            titleElement.textContent = this.title;
        } else {
            titleElement.style.display = "none";
        }

        if (this.subtitle) {
            subtitleElement.textContent = this.subtitle;
        } else {
            subtitleElement.style.display = "none";
        }

        if (this.caption) {
            captionElement.textContent = this.caption;
        } else {
            captionElement.style.display = "none";
        }

        const nextPage = this.nextPage;

        // If the next page is provided, clicking the image continues there. Otherwise show the restart button.
        if (nextPage) {
            imageElement.addEventListener(
                "click",
                () => {
                    this.story.openPage(nextPage, true);
                },
                { once: true }
            );
        } else {
            this.showRestartButton();
        }
    }
}

export default ImagePage;
