"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "nebula-notification-permission-change";

function readPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }
  return Notification.permission;
}

/**
 * Notification.permission is browser state, not React state. It only changes
 * in response to requestPermission(), which dispatches CHANGE_EVENT so every
 * mounted consumer re-reads it.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function getServerSnapshot(): NotificationPermission {
  return "default";
}

export function useNotifications() {
  const permission = useSyncExternalStore(
    subscribe,
    readPermission,
    getServerSnapshot
  );

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (readPermission() !== "granted") return;
      new Notification(title, {
        icon: "/favicon.ico", // Default icon if not provided
        ...options,
      });
    },
    []
  );

  return { permission, requestPermission, sendNotification };
}
