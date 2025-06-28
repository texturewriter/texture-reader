import TextureStory from "./story";

import "./layout/main.css";

declare global {
    interface Window {
        textureReaderOptions: {};
        textureReader: {
            TextureStory: typeof TextureStory;
        };
    }
}

window.textureReader = {
    TextureStory
};

if (__AUTOSTART__) {
    window.addEventListener("DOMContentLoaded", () => {
        // The values for these substitutions are defined in vite.config.ts
        const story = new TextureStory(__STORY_DATA__, __TEXTURE_CONFIG__);
        story.start();
    });
}
