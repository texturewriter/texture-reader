import ActionBehavior, { type ActionBehaviorSerialization } from "./behavior";
import type TextureStory from "../story";

export interface PageActionSerialization {
    behaviors: ActionBehaviorSerialization[];
    name?: string | null;
    noun: string;
    verb: string;
}

/**
 * An action is a set of possible behaviors of a verb/noun combination
 */
class Action {
    private readonly story: TextureStory;
    private readonly action: PageActionSerialization;
    private readonly behaviors: ActionBehavior[];

    // an action can only be triggered once per page
    private active: boolean = true;

    constructor(story: TextureStory, action: PageActionSerialization) {
        this.story = story;
        this.action = action;

        if (!action) {
            throw new Error("No action provided to Action constructor");
        }

        this.behaviors = action.behaviors?.map(
            (behavior, index) =>
                new ActionBehavior(
                    story,
                    behavior,
                    this,
                    index === action.behaviors.length - 1
                )
        );
    }

    public get isActive(): boolean {
        return this.active;
    }

    public get name(): string | undefined {
        if (!this.action) {
            throw new Error("No action set");
        }

        return this.action.name ?? undefined;
    }

    public get nounId(): string {
        if (!this.action) {
            throw new Error("No action set");
        }

        return this.action.noun;
    }

    public get verbId(): string {
        if (!this.action) {
            throw new Error("No action set");
        }

        return this.action.verb;
    }

    public disable() {
        this.active = false;
    }

    // Check if this action is for the given verb or verb/noun pair
    public isActionFor(verbId: string, nounId?: string) {
        if (!this.isActive) {
            return false;
        }

        if (!nounId) {
            return this.verbId === verbId;
        }

        return this.verbId === verbId && this.nounId === nounId;
    }

    // Find which of this action's behaviors is currently valid, based on the required flags
    public getValidBehavior(): ActionBehavior | null {
        return (
            this.behaviors.find(behavior => {
                if (
                    !behavior.condition ||
                    behavior.condition.setFlags.length +
                        behavior.condition.unsetFlags.length ===
                        0
                ) {
                    // if the behavior has no conditions, it's valid only if it's the default behavior
                    return behavior.isDefault;
                }

                const { setFlags, unsetFlags } = behavior.condition;

                if (behavior.condition.connective === "and") {
                    // for the AND connective, all specified flags must be set and unset
                    return (
                        setFlags.every(flag => this.story.flags.isSet(flag)) &&
                        unsetFlags.every(flag => this.story.flags.isUnset(flag))
                    );
                } else if (behavior.condition.connective === "or") {
                    // for the OR connective, any of the specified flags must be set and unset
                    return (
                        setFlags.some(flag => this.story.flags.isSet(flag)) ||
                        unsetFlags.some(flag => this.story.flags.isUnset(flag))
                    );
                } else {
                    throw new Error(
                        "Unknown connective " + behavior.condition.connective
                    );
                }
            }) ?? null
        );
    }
}

export default Action;
