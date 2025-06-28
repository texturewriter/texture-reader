import { describe, it, expect } from "vitest";

import { urlToCssBackgroundUrl } from "../css";

describe("urlToCssBackgroundUrl", () => {
    it("wraps a regular URL with quotes and encodes it", () => {
        const result = urlToCssBackgroundUrl("https://example.com/image.png");
        expect(result).toBe('url("https://example.com/image.png")');
    });

    it("leaves data:image URLs unencoded", () => {
        const dataUrl = "data:image/png;base64,ABC123==";
        const result = urlToCssBackgroundUrl(dataUrl);
        expect(result).toBe(`url("${dataUrl}")`);
    });

    it("encodes special characters in URLs", () => {
        const result = urlToCssBackgroundUrl(
            "https://example.com/image name.png"
        );
        expect(result).toBe('url("https://example.com/image%20name.png")');
    });
});
