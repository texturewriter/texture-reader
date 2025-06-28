import { describe, it, expect, vi, afterEach } from "vitest";

import CoverPage from "./";

describe("CoverPage", () => {
    afterEach(() => {
        document.body.innerHTML = "";
        vi.useRealTimers();
    });

    it("resolves immediately if URL is empty", async () => {
        const coverPage = new CoverPage("");
        expect(coverPage.show()).toBeUndefined();
    });

    it("handles image loading failure", async () => {
        globalThis.Image = class {
            onload: () => void = () => {};
            onerror: () => void = () => {};
            set src(_value: string) {
                setTimeout(() => this.onerror(), 0);
            }
        } as any;

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const coverPage = new CoverPage("bad_url");

        await coverPage.show();
        expect(warnSpy).toHaveBeenCalledWith(
            "Could not load cover image from URL bad_url"
        );

        warnSpy.mockRestore();
    });
});
