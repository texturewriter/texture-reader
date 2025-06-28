import { describe, it, expect, vi } from "vitest";

import { pause } from "../async";

describe("pause", () => {
    it("resolves after the specified duration", async () => {
        let resolved = false;
        vi.useFakeTimers();
        pause(1).then(() => (resolved = true));
        vi.advanceTimersByTime(999);
        await Promise.resolve();
        expect(resolved).toBe(false);
        vi.advanceTimersByTime(1);
        await Promise.resolve();
        expect(resolved).toBe(true);
        vi.useRealTimers();
    });
});
