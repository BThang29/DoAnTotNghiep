(function (window, document) {
    "use strict";

    const containerId = "app-notification-container";
    const flashStorageKey = "app-flash-notification";

    function ensureContainer() {
        let container = document.getElementById(containerId);

        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            document.body.appendChild(container);
        }

        return container;
    }

    function show(message, type, duration) {
        if (!message) {
            return;
        }

        const container = ensureContainer();
        const notification = document.createElement("div");
        const timeout = typeof duration === "number" ? duration : 2000;
        let removeTimer = null;

        notification.className = `app-notification app-notification-${type || "info"}`;
        notification.textContent = message;
        notification.addEventListener("click", () => {
            if (removeTimer) {
                window.clearTimeout(removeTimer);
            }

            notification.remove();
        });
        container.appendChild(notification);

        removeTimer = window.setTimeout(() => {
            notification.remove();
        }, timeout);
    }

    function push(message, type, duration) {
        if (!message || !window.sessionStorage) {
            return;
        }

        const payload = {
            message,
            type: type || "info",
            duration: typeof duration === "number" ? duration : 2000
        };

        window.sessionStorage.setItem(flashStorageKey, JSON.stringify(payload));
    }

    function redirectWithNotification(url, message, type, duration) {
        push(message, type, duration);

        if (url) {
            window.location.href = url;
        }
    }

    function consumeFlashNotification() {
        if (!window.sessionStorage) {
            return;
        }

        const rawValue = window.sessionStorage.getItem(flashStorageKey);

        if (!rawValue) {
            return;
        }

        window.sessionStorage.removeItem(flashStorageKey);

        try {
            const payload = JSON.parse(rawValue);
            show(payload?.message, payload?.type, payload?.duration);
        } catch (error) {
            show(rawValue, "info", 2000);
        }
    }

    function registerFlashConsumer() {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", consumeFlashNotification, { once: true });
            return;
        }

        consumeFlashNotification();
    }

    window.appNotifier = {
        show,
        push,
        redirectWithNotification,
        success(message, duration) {
            show(message, "success", duration);
        },
        warning(message, duration) {
            show(message, "warning", duration);
        },
        error(message, duration) {
            show(message, "error", duration);
        },
        info(message, duration) {
            show(message, "info", duration);
        }
    };

    registerFlashConsumer();
})(window, document);
﻿
