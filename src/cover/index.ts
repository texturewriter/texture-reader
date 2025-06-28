import { urlToCssBackgroundUrl } from "../services/css";
import containers from "../layout/containers";

import "./cover.css";

// how long the cover image is visible before automatically continuing
const DEFAULT_COVER_IMAGE_MAX_VISIBLE_SECONDS = 10;

// time to fade out the image, should match the transition animation in the CSS class
const COVER_IMAGE_FADEOUT_SECONDS = 0.5;

/**
 * The cover image shown at the start of the story
 */
class CoverPage {
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    public show(duration = DEFAULT_COVER_IMAGE_MAX_VISIBLE_SECONDS) {
        if (!this.url || typeof this.url !== "string") {
            return;
        }

        return new Promise<void>(resolve => {
            let fadetimer: number;

            const coverContainer = document.createElement("div");
            coverContainer.className = "cover-container";

            const coverImg = document.createElement("div");
            coverImg.className = "cover-img";
            coverImg.style.backgroundImage = urlToCssBackgroundUrl(this.url);
            coverContainer.appendChild(coverImg);

            const fadeout = () => {
                coverContainer.classList.add("fade-out");
                coverContainer.removeEventListener("click", fadeout);

                setTimeout(() => {
                    coverContainer.remove();
                    resolve();
                }, COVER_IMAGE_FADEOUT_SECONDS * 1000);

                clearTimeout(fadetimer);
            };

            coverContainer.addEventListener("click", fadeout, { once: true });

            // A separate image element not shown on the page checks when the image has loaded and handles errors if it doesn't.
            // The cover is shown as a background image instead of an actual img element because it makes it easier to resize it
            // when the image is larger than the player's screen.
            const imgElem = new Image();

            imgElem.onload = () => {
                coverImg.style.maxWidth = `${imgElem.width}px`;
                coverImg.style.maxHeight = `${imgElem.height}px`;
                containers.story.appendChild(coverContainer);
                requestAnimationFrame(() => {
                    coverContainer.classList.add("visible");
                });
                fadetimer = window.setTimeout(fadeout, duration * 1000);
            };

            imgElem.onerror = () => {
                console.warn("Could not load cover image from URL " + this.url);
                fadeout();
            };

            imgElem.src = this.url;
        });
    }
}

export default CoverPage;
