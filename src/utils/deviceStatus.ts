/**
 * Device Status Utilities
 * Helper functions for checking device online/offline status
 */

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a device is considered offline based on last seen timestamp
 */
export function isDeviceOffline(lastSeen: string | Date | undefined): boolean {
    if (!lastSeen) return true;

    const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    const now = new Date();
    const timeDiff = now.getTime() - lastSeenDate.getTime();

    return timeDiff > OFFLINE_THRESHOLD_MS;
}

/**
 * Get human-readable device status text
 */
export function getDeviceStatusText(lastSeen: string | Date | undefined): string {
    if (!lastSeen) return 'Never seen';

    if (isDeviceOffline(lastSeen)) {
        return 'Offline';
    }

    return 'Online';
}

/**
 * Format last seen timestamp in a human-readable way
 */
export function formatLastSeen(lastSeen: string | Date | undefined): string {
    if (!lastSeen) return 'Never';

    const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

/**
 * Get time difference in milliseconds
 */
export function getTimeSinceLastSeen(lastSeen: string | Date | undefined): number {
    if (!lastSeen) return Infinity;

    const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    const now = new Date();
    return now.getTime() - lastSeenDate.getTime();
}
