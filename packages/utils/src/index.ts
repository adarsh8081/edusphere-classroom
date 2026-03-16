/**
 * @edusphere/utils — Shared Utilities
 *
 * Common helper functions used across apps and services.
 */

/**
 * Format a date string for display
 */
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/**
 * Format a relative time string (e.g., "2 hours ago")
 */
export function timeAgo(date: Date | string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
    return "just now";
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + "...";
}

/**
 * Generate a random hex string of specified length
 */
export function randomHex(bytes: number): string {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}
