import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

interface BuildVariantDefines {
    // Should the story start automatically when the page loads?
    __AUTOSTART__: boolean;

    // The story data used with autostart
    __STORY_DATA__?: string | null;

    // The story configuration used with autostart
    __TEXTURE_CONFIG__?: string;
}

export default defineConfig(({ mode }) => {
    let define: BuildVariantDefines;

    switch (mode) {
        // A single-page HTML template that can have the story data bundled with it
        case "bundle":
            define = {
                __AUTOSTART__: true,
                __STORY_DATA__: JSON.stringify("%%STORYDATA%%"),
                __TEXTURE_CONFIG__: JSON.stringify({
                    coverUrl: "%%COVERURL%%",
                    disableUrlOptions: true
                })
            };
            break;

        // A standalone build for custom use outside the writer
        case "standalone":
            define = {
                __AUTOSTART__: false
            };
            break;

        // Embedded with the writer
        case "writer":
            define = {
                __AUTOSTART__: false
            };
            break;

        case "development":
            define = {
                __AUTOSTART__: true,
                __STORY_DATA__: null,
                __TEXTURE_CONFIG__: "{}"
            };
            break;

        case "production":
            throw new Error(
                'Use a more specific build variant than "production" as the mode (e.g. --mode standalone)'
            );

        default:
            throw new Error(`Unknown build mode ${mode}`);
    }

    return {
        build: {
            assetsInlineLimit: Infinity,
            cssCodeSplit: false,
            minify: "terser",
            outDir: "dist",
            target: "esnext"
        },
        define,
        plugins: [viteSingleFile()]
    };
});
