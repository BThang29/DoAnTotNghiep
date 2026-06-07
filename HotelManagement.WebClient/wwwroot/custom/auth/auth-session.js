(function (window, document) {
    "use strict";

    const storageKey = "webappclient-auth-session";

    function parseJson(value) {
        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function decodeJwtPayload(token) {
        const normalizedToken = String(token || "").trim();
        if (!normalizedToken) {
            return null;
        }

        const segments = normalizedToken.split(".");
        if (segments.length < 2) {
            return null;
        }

        try {
            const base64 = segments[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");
            const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
            return parseJson(window.atob(padded));
        } catch (error) {
            return null;
        }
    }

    function resolveSessionExpiry(session) {
        if (!session?.accessToken) {
            return null;
        }

        const jwtPayload = decodeJwtPayload(session.accessToken);
        const jwtExpiry = Number(jwtPayload?.exp || 0);
        if (Number.isFinite(jwtExpiry) && jwtExpiry > 0) {
            return jwtExpiry * 1000;
        }

        const expiresValue = session?.expires;
        if (!expiresValue) {
            return null;
        }

        const parsedExpiry = new Date(expiresValue);
        if (Number.isNaN(parsedExpiry.getTime())) {
            return null;
        }

        return parsedExpiry.getTime();
    }

    function isSessionExpired(session) {
        if (!session?.accessToken) {
            return true;
        }

        const expiryTime = resolveSessionExpiry(session);
        if (!expiryTime) {
            return false;
        }

        return Date.now() >= expiryTime;
    }

    function normalizeSessionIdentifiers(session) {
        if (!session?.accessToken) {
            return session;
        }

        const jwtPayload = decodeJwtPayload(session.accessToken) || {};
        const normalizedSession = {
            ...session
        };

        const resolvedUserId = Number(
            normalizedSession.userId ||
            jwtPayload.user_id ||
            jwtPayload.userId ||
            jwtPayload.UserId ||
            0
        );

        if (Number.isFinite(resolvedUserId) && resolvedUserId > 0) {
            normalizedSession.userId = resolvedUserId;
        }

        return normalizedSession;
    }

    function getSession() {
        if (!window.localStorage) {
            return null;
        }

        const session = parseJson(window.localStorage.getItem(storageKey));
        if (!session) {
            return null;
        }

        if (isSessionExpired(session)) {
            clearSession();
            return null;
        }

        const normalizedSession = normalizeSessionIdentifiers(session);
        if (JSON.stringify(normalizedSession) !== JSON.stringify(session)) {
            setSession(normalizedSession);
        }

        return normalizedSession;
    }

    function setSession(session) {
        if (!window.localStorage) {
            return;
        }

        window.localStorage.setItem(storageKey, JSON.stringify(normalizeSessionIdentifiers(session || {})));
    }

    function clearSession() {
        if (!window.localStorage) {
            return;
        }

        window.localStorage.removeItem(storageKey);
    }

    function updateNavbar() {
        const session = getSession();
        const isLoggedIn = Boolean(session?.accessToken);
        const guestItems = document.querySelectorAll("[data-auth-guest]");
        const userItems = document.querySelectorAll("[data-auth-user]");
        const userNames = document.querySelectorAll("[data-auth-username]");
        const displayName = String(session?.fullName || session?.username || "Khách hàng").trim();

        guestItems.forEach(item => {
            item.style.display = isLoggedIn ? "none" : "";
        });

        userItems.forEach(item => {
            item.style.display = isLoggedIn ? "" : "none";
        });

        userNames.forEach(item => {
            item.textContent = displayName;
        });
    }

    function handleExpiredSessionOnLoad() {
        if (!window.localStorage) {
            return;
        }

        const storedSession = parseJson(window.localStorage.getItem(storageKey));
        if (!storedSession || !storedSession.accessToken || !isSessionExpired(storedSession)) {
            updateNavbar();
            return;
        }

        clearSession();
        updateNavbar();

        const currentPath = String(window.location.pathname || "").toLowerCase();
        const isHomePage = currentPath === "/" || currentPath === "/home" || currentPath === "/home/index";
        if (isHomePage) {
            window.appNotifier?.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            return;
        }

        if (window.appNotifier?.redirectWithNotification) {
            window.appNotifier.redirectWithNotification("/Home/Index", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "warning");
            return;
        }

        window.location.href = "/Home/Index";
    }

    function logout() {
        clearSession();
        updateNavbar();
        if (window.appNotifier?.redirectWithNotification) {
            window.appNotifier.redirectWithNotification("/Home/Index", "Đăng xuất thành công", "success");
            return;
        }

        window.location.href = "/Home/Index";
    }

    document.addEventListener("click", event => {
        const logoutLink = event.target.closest("[data-auth-logout='true']");
        if (!logoutLink) {
            return;
        }

        event.preventDefault();
        logout();
    });

    window.webAppClientAuth = {
        getSession,
        setSession,
        clearSession,
        isSessionExpired,
        updateNavbar,
        logout
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", handleExpiredSessionOnLoad, { once: true });
    } else {
        handleExpiredSessionOnLoad();
    }
})(window, document);
