export const CURSOR_OFFSET = 5;

/**
 * Escape a URL and turn it into a url() property for use with CSS styles
 */
export const urlToCssBackgroundUrl = (url: string): string => {
    const escapedUrl = url.startsWith("data:image/") ? url : encodeURI(url);

    return `url("${escapedUrl}")`;
};

/**
 * The boundingClientRect and left/top margins of an element
 */
const rectAndMargins = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const leftMargin = parseFloat(style.marginLeft);
    const topMargin = parseFloat(style.marginTop);

    return { rect, leftMargin, topMargin };
};

/**
 * A fixed element's current position to be used as the left and top properties, taking margins into account
 */
export const getElementFixedPosition = (
    element: Element
): { left: string; top: string } => {
    const { rect, leftMargin, topMargin } = rectAndMargins(element);

    return {
        left: `${rect.left - leftMargin}px`,
        top: `${rect.top - topMargin}px`
    };
};

/**
 * Find out what offset to use when dragging an element so that the pointer is right under the verb's triangle indicator
 */
export const getElementDragOffset = (
    element: Element
): { x: number; y: number } => {
    const { rect, leftMargin, topMargin } = rectAndMargins(element);

    return {
        x: rect.width / 2 + leftMargin - 1,
        y: rect.height + topMargin + 10 + CURSOR_OFFSET // 10 px is the height of the speech bubble triangle
    };
};
