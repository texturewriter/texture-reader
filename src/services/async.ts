/**
 * A helper to easily pause the execution of an async function for the given duration (in seconds)
 */
export const pause = (duration: number) =>
    new Promise<void>(resolve => setTimeout(resolve, duration * 1000));
