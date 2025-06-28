import type { BookSerialization } from "../story";

/**
 * Handling story flags
 */
class StoryFlags {
    private readonly activeFlags: Set<string> = new Set();
    private readonly allFlags: Set<string> = new Set();

    // Setting and unsetting flags
    public set(flag: string) {
        this.activeFlags.add(flag.toLowerCase());
    }

    public setAll(flags: string[]) {
        flags.forEach(flag => this.set(flag));
    }

    public unset(flag: string) {
        this.activeFlags.delete(flag.toLowerCase());
    }

    public unsetAll(flags: string[]) {
        flags.forEach(flag => this.unset(flag));
    }

    public resetAll() {
        this.activeFlags.clear();
    }

    /**
     * Collect all flags from the story, for debugging
     */
    public populateAllFlags(book: BookSerialization) {
        const collectFromArray = (newFlags?: string[] | "") => {
            if (Array.isArray(newFlags)) {
                newFlags.forEach(flag => this.allFlags.add(flag));
            }
        };

        book.pages.forEach(page => {
            if (page.events?.enter) {
                collectFromArray(page.events.enter.setFlags);
                collectFromArray(page.events.enter.unsetFlags);
            }

            if (page.events?.exit) {
                collectFromArray(page.events.exit.setFlags);
                collectFromArray(page.events.exit.unsetFlags);
            }

            page.actions?.forEach(action =>
                action.behaviors?.forEach(behavior => {
                    collectFromArray(behavior.setFlags);
                    collectFromArray(behavior.unsetFlags);
                })
            );
        });
    }

    /**
     * Toggle flags from the general shape of different rules that toggle flags
     */
    public toggleFlagsFromRules(rule: {
        setFlags?: string[];
        unsetFlags?: string[];
    }) {
        if (!rule) {
            return;
        }

        if (rule.setFlags) {
            this.setAll(rule.setFlags);
        }

        if (rule.unsetFlags) {
            this.unsetAll(rule.unsetFlags);
        }
    }

    /**
     *  Check if a flag is set
     */
    public isSet(flag: string) {
        return this.activeFlags.has(flag.toLowerCase());
    }

    /**
     *  Check if a flag is unset
     */
    public isUnset(flag: string) {
        return !this.isSet(flag);
    }
}

export default StoryFlags;
