import { describe, it, expect, beforeEach } from "vitest";
import StoryFlags from ".";

describe("StoryFlags", () => {
    let flags: StoryFlags;

    beforeEach(() => {
        flags = new StoryFlags();
    });

    it("sets and unsets flags correctly", () => {
        expect(flags.isSet("flag1")).toBe(false);
        expect(flags.isUnset("flag1")).toBe(true);

        flags.set("FLAG1");
        expect(flags.isSet("flag1")).toBe(true);
        expect(flags.isSet("Flag1")).toBe(true);
        expect(flags.isSet("FLAG1")).toBe(true);
        expect(flags.isUnset("flag1")).toBe(false);

        flags.unset("flag1");
        expect(flags.isSet("FLAG1")).toBe(false);
        expect(flags.isSet("flag1")).toBe(false);
        expect(flags.isUnset("flag1")).toBe(true);
    });

    it("sets and unsets multiple flags", () => {
        expect(flags.isSet("a")).toBe(false);
        expect(flags.isSet("b")).toBe(false);

        flags.setAll(["A", "B"]);
        expect(flags.isSet("a")).toBe(true);
        expect(flags.isSet("b")).toBe(true);

        flags.unsetAll(["A", "B"]);
        expect(flags.isSet("a")).toBe(false);
        expect(flags.isSet("b")).toBe(false);
    });

    it("resets all flags", () => {
        expect(flags.isSet("a")).toBe(false);
        expect(flags.isSet("b")).toBe(false);

        flags.setAll(["A", "B"]);

        expect(flags.isSet("a")).toBe(true);
        expect(flags.isSet("b")).toBe(true);

        flags.resetAll();

        expect(flags.isSet("a")).toBe(false);
        expect(flags.isSet("b")).toBe(false);
    });

    it("toggles flags from rules", () => {
        flags.setAll(["c", "e"]);

        flags.toggleFlagsFromRules({
            setFlags: ["a", "b"],
            unsetFlags: ["c", "d"]
        });

        expect(flags.isSet("a")).toBe(true);
        expect(flags.isSet("b")).toBe(true);
        expect(flags.isSet("c")).toBe(false);
        expect(flags.isSet("d")).toBe(false);
        expect(flags.isSet("e")).toBe(true);
    });

    it("ignores empty rules", () => {
        expect(() => flags.toggleFlagsFromRules(null as any)).not.toThrow();
    });
});
