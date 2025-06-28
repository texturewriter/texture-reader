import { describe, it, expect } from "vitest";
import Action from ".";
import type { ActionBehaviorSerialization } from "./behavior";

describe("Action", () => {
    let story: any = {
        flags: {
            isSet: (flag: string) => flag === "a",
            isUnset: (flag: string) => flag !== "a"
        }
    };

    it("initializes correctly", () => {
        const action = new Action(story, {
            name: "Test Action",
            behaviors: [],
            noun: "object",
            verb: "act"
        });
        expect(action.isActive).toBe(true);
        expect(action.name).toBe("Test Action");
        expect(action.nounId).toBe("object");
        expect(action.verbId).toBe("act");
    });

    it("gets disabled", () => {
        const action = new Action(story, {
            behaviors: [],
            noun: "object",
            verb: "act"
        });
        action.disable();
        expect(action.isActive).toBe(false);
    });

    it("matches verb and noun correctly", () => {
        const action = new Action(story, {
            behaviors: [],
            noun: "object",
            verb: "act"
        });

        expect(action.isActionFor("act")).toBe(true);
        expect(action.isActionFor("act", "object")).toBe(true);
        expect(action.isActionFor("other")).toBe(false);
        expect(action.isActionFor("other", "object")).toBe(false);
        action.disable();
        expect(action.isActionFor("act")).toBe(false);
    });

    it("throws an error when the action is missing", () => {
        expect(() => new Action(story, null as any)).toThrow();
    });

    it("returns valid behavior based on AND rules", () => {
        const validBehavior: ActionBehaviorSerialization = {
            name: "Valid behavior",
            condition: {
                setFlags: ["a"],
                unsetFlags: ["b"],
                connective: "and"
            }
        };
        const invalidBehavior: ActionBehaviorSerialization = {
            name: "Invalid behavior",
            condition: {
                setFlags: ["c"],
                unsetFlags: ["d"],
                connective: "and"
            }
        };
        const defaultBehavior: ActionBehaviorSerialization = {
            name: "Default behavior",
            condition: {
                setFlags: [],
                unsetFlags: [],
                connective: "and"
            }
        };

        const actionWithValidBehavior = new Action(story, {
            behaviors: [validBehavior, defaultBehavior],
            noun: "object",
            verb: "act"
        });

        expect(actionWithValidBehavior.getValidBehavior()?.name).toBe(
            "Valid behavior"
        );

        const actionWithInvalidBehavior = new Action(story, {
            behaviors: [invalidBehavior, defaultBehavior],
            noun: "object",
            verb: "act"
        });

        expect(actionWithInvalidBehavior.getValidBehavior()?.name).toBe(
            "Default behavior"
        );
    });

    it("returns valid behavior based on OR rules", () => {
        const validBehavior: ActionBehaviorSerialization = {
            name: "Valid behavior",
            condition: {
                setFlags: ["a", "b"],
                unsetFlags: ["c", "d"],
                connective: "or"
            }
        };
        const invalidBehavior: ActionBehaviorSerialization = {
            name: "Invalid behavior",
            condition: {
                setFlags: ["c"],
                unsetFlags: ["a"],
                connective: "or"
            }
        };
        const defaultBehavior: ActionBehaviorSerialization = {
            name: "Default behavior",
            condition: {
                setFlags: [],
                unsetFlags: [],
                connective: "and"
            }
        };

        const actionWithValidBehavior = new Action(story, {
            behaviors: [validBehavior, defaultBehavior],
            noun: "object",
            verb: "act"
        });

        expect(actionWithValidBehavior.getValidBehavior()?.name).toBe(
            "Valid behavior"
        );

        const actionWithInvalidBehavior = new Action(story, {
            behaviors: [invalidBehavior, defaultBehavior],
            noun: "object",
            verb: "act"
        });

        expect(actionWithInvalidBehavior.getValidBehavior()?.name).toBe(
            "Default behavior"
        );
    });

    it("throws an error on unknown connective", () => {
        const invalidBehavior: any = {
            name: "Invalid behavior",
            condition: {
                setFlags: ["a"],
                unsetFlags: ["b"],
                connective: "xor"
            }
        };

        const action = new Action(story, {
            behaviors: [invalidBehavior],
            noun: "object",
            verb: "act"
        });

        expect(() => action.getValidBehavior()).toThrow();
    });

    it("returns null when no behaviors match", () => {
        const invalidBehavior: any = {
            name: "Invalid behavior",
            condition: {
                setFlags: ["a", "b"],
                unsetFlags: [],
                connective: "and"
            }
        };

        const action = new Action(story, {
            behaviors: [invalidBehavior],
            noun: "object",
            verb: "act"
        });

        expect(action.getValidBehavior()).toBeNull();
    });
});
