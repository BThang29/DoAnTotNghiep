(function (window) {
    "use strict";

    const defaultApiBaseUrl = "http://localhost:5010";
    const appConfig = window.appConfig || {};

    function trimTrailingSlash(value) {
        return String(value || "").replace(/\/+$/, "");
    }

    function resolveApiBaseUrl() {
        return trimTrailingSlash(appConfig.apiBaseUrl || defaultApiBaseUrl);
    }

    window.appConfig = {
        ...appConfig,
        apiBaseUrl: resolveApiBaseUrl()
    };

    window.appUrl = window.appUrl || function (path) {
        const normalizedPath = String(path || "");

        if (/^https?:\/\//i.test(normalizedPath)) {
            return normalizedPath;
        }

        return window.appConfig.apiBaseUrl + "/" + normalizedPath.replace(/^\/+/, "");
    };

    const authExcludedPaths = [
        "/auth/login",
        "/auth/register"
    ];
    const accessTokenKey = "accessToken";
    const legacyTokenKey = "token";
    const refreshTokenKey = "refreshToken";
    const currentUserKey = "currentUser";
    const loadingOverlayId = "app-global-api-loading";
    let pendingRequestCount = 0;

    function normalizePath(path) {
        const normalized = String(path || "").toLowerCase().replace(/\/+$/, "");
        return normalized || "/";
    }

    function parseExpiryValue(currentUser) {
        const rawValue = currentUser?.expiresString || currentUser?.expires || "";
        if (!rawValue) {
            return null;
        }

        const parsedDate = new Date(rawValue);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    function isCurrentUserExpired(currentUser) {
        if (!currentUser) {
            return false;
        }

        const expiryDate = parseExpiryValue(currentUser);
        if (!expiryDate) {
            return false;
        }

        return expiryDate.getTime() <= Date.now();
    }

    function getStoredCurrentUser() {
        const rawValue = localStorage.getItem(currentUserKey)
            || sessionStorage.getItem(currentUserKey);

        if (!rawValue) {
            return null;
        }

        try {
            return JSON.parse(rawValue);
        } catch (error) {
            return null;
        }
    }

    function getPrimaryStorage() {
        return localStorage.getItem(accessTokenKey) || localStorage.getItem(legacyTokenKey)
            ? localStorage
            : sessionStorage;
    }

    function getAccessToken() {
        const currentUser = getStoredCurrentUser();
        if (isCurrentUserExpired(currentUser)) {
            clearStorage(localStorage);
            clearStorage(sessionStorage);
            return "";
        }

        return localStorage.getItem(accessTokenKey)
            || localStorage.getItem(legacyTokenKey)
            || sessionStorage.getItem(accessTokenKey)
            || sessionStorage.getItem(legacyTokenKey)
            || "";
    }

    function getCurrentUser() {
        const currentUser = getStoredCurrentUser();
        if (!currentUser) {
            return null;
        }

        if (isCurrentUserExpired(currentUser)) {
            clearStorage(localStorage);
            clearStorage(sessionStorage);
            return null;
        }

        return currentUser;
    }

    function clearStorage(storage) {
        storage.removeItem(accessTokenKey);
        storage.removeItem(legacyTokenKey);
        storage.removeItem(refreshTokenKey);
        storage.removeItem(currentUserKey);
    }

    function ensureLoadingOverlay() {
        let overlay = document.getElementById(loadingOverlayId);
        if (overlay) {
            return overlay;
        }

        overlay = document.createElement("div");
        overlay.id = loadingOverlayId;
        overlay.style.cssText = [
            "position:fixed",
            "inset:0",
            "z-index:9999",
            "display:none",
            "align-items:center",
            "justify-content:center",
            "background:rgba(255,255,255,0.68)",
            "backdrop-filter:blur(2px)"
        ].join(";");

        overlay.innerHTML = `
            <div style="min-width:260px;padding:20px 24px;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(15,23,42,.16);text-align:center;">
                <div style="width:32px;height:32px;margin:0 auto 12px;border:3px solid rgba(78,115,223,.18);border-top-color:#4e73df;border-radius:50%;animation:app-global-api-spin .8s linear infinite;"></div>
                <div style="font-weight:700;color:#344054;">Đang tải dữ liệu...</div>
                <div style="margin-top:6px;font-size:13px;color:#667085;">Vui lòng chờ phản hồi từ hệ thống.</div>
            </div>`;

        if (!document.getElementById("app-global-api-loading-style")) {
            const style = document.createElement("style");
            style.id = "app-global-api-loading-style";
            style.textContent = "@keyframes app-global-api-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
        return overlay;
    }

    function setGlobalLoading(isLoading) {
        const overlay = ensureLoadingOverlay();
        pendingRequestCount = isLoading
            ? pendingRequestCount + 1
            : Math.max(0, pendingRequestCount - 1);

        overlay.style.display = pendingRequestCount > 0 ? "flex" : "none";
    }

    function shouldSkipAuth(url, options) {
        if (options?.skipAuth === true) {
            return true;
        }

        const normalizedUrl = (url || "").toLowerCase();
        return authExcludedPaths.some(path => normalizedUrl.includes(path));
    }

    function buildPrivilegeSet(privileges) {
        return new Set((Array.isArray(privileges) ? privileges : [])
            .filter(Boolean)
            .map(privilege => String(privilege).trim()));
    }

    function hasAnyPrivilege(privilegeSet, privileges) {
        return privileges.some(privilege => privilegeSet.has(privilege));
    }

    function hasPrivilegeGroup(privilegeSet, groups) {
        return groups.every(group => hasAnyPrivilege(privilegeSet, group));
    }

    function resolveDefaultAdminPath(currentUser) {
        const privilegeSet = buildPrivilegeSet(currentUser?.privileges);
        const routes = [
            {
                path: "/Home/Index",
                any: ["ViewDashboard", "ViewReport", "ViewRevenueReport"]
            },
            {
                path: "/BookingRoom/BookingRoom",
                all: [
                    ["ViewBooking", "ManageBooking"],
                    ["ViewRoom", "ManageRoom"]
                ]
            },
            {
                path: "/BookingRoom/CheckAvailableRoom",
                any: ["ViewRoom", "ManageRoom"]
            },
            {
                path: "/BookingRoom/Deposit",
                any: ["ManageBooking"]
            },
            {
                path: "/Invoice/Invoices",
                any: ["ViewInvoice", "ManageInvoice", "CreateInvoice"]
            },
            {
                path: "/Payment/Payments",
                any: ["ViewPayment", "ManagePayment"]
            },
            {
                path: "/Payment/PaymentQr",
                any: ["ViewPayment", "ManagePayment"]
            },
            {
                path: "/Room/Rooms",
                any: ["ViewRoom", "ManageRoom"]
            },
            {
                path: "/Room/RoomTypes",
                any: ["ViewRoom", "ManageRoom"]
            },
            {
                path: "/Room/RoomStatuses",
                any: ["ViewRoom", "ManageRoom"]
            },
            {
                path: "/Other/Services",
                any: ["ViewService", "ManageService"]
            },
            {
                path: "/Other/ServiceTypes",
                any: ["ViewService", "ManageService"]
            }
        ];

        const matchedRoute = routes.find(route => {
            if (Array.isArray(route.all)) {
                return hasPrivilegeGroup(privilegeSet, route.all);
            }

            return hasAnyPrivilege(privilegeSet, route.any || []);
        });

        return matchedRoute?.path || "/Auth/Login";
    }

    function bootstrapAuthSession() {
        const currentPath = normalizePath(window.location.pathname);
        const isAuthPage = authExcludedPaths.includes(currentPath);
        const currentUser = getCurrentUser();
        const token = getAccessToken();

        if (isAuthPage) {
            if (token && currentUser) {
                const nextPath = resolveDefaultAdminPath(currentUser);
                if (normalizePath(nextPath) !== currentPath) {
                    window.location.replace(nextPath);
                }
            }

            return;
        }

        if (!token || !currentUser) {
            window.location.replace("/Auth/Login");
        }
    }

    async function request(url, method, data, options) {
        const config = options || {};
        const headers = {
            "Content-Type": "application/json",
            ...(config.headers || {})
        };
        const token = getAccessToken();

        if (!shouldSkipAuth(url, config) && token && !headers.Authorization) {
            headers.Authorization = `Bearer ${token}`;
        }

        const fetchOptions = {
            method: method,
            headers: headers
        };

        if (data !== undefined && data !== null) {
            fetchOptions.body = JSON.stringify(data);
        }

        const shouldShowLoading = config.showLoading !== false;

        if (shouldShowLoading) {
            setGlobalLoading(true);
        }

        try {
            const response = await fetch(url, fetchOptions);
            const contentType = response.headers.get("content-type") || "";
            const isJson = contentType.includes("application/json");
            const responseData = isJson ? await response.json() : await response.text();

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: responseData?.message || response.statusText,
                    data: responseData
                };
            }

            return responseData;
        } finally {
            if (shouldShowLoading) {
                setGlobalLoading(false);
            }
        }
    }

    const apiClient = {
        Get(url, options) {
            return request(url, "GET", null, options);
        },
        Post(url, data, options) {
            return request(url, "POST", data, options);
        },
        Put(url, data, options) {
            return request(url, "PUT", data, options);
        },
        Delete(url, options) {
            return request(url, "DELETE", null, options);
        },
        setToken(token, useSessionStorage) {
            clearStorage(localStorage);
            clearStorage(sessionStorage);

            const storage = useSessionStorage ? sessionStorage : localStorage;
            storage.setItem(accessTokenKey, token);
        },
        setAuthSession(authData, useSessionStorage) {
            clearStorage(localStorage);
            clearStorage(sessionStorage);

            const storage = useSessionStorage ? sessionStorage : localStorage;
            const token = authData?.access_token || authData?.accessToken || authData?.token || "";
            const refreshToken = authData?.refresh_token || authData?.refreshToken || "";
            const currentUser = {
                userId: authData?.userId || 0,
                username: authData?.username || "",
                fullName: authData?.fullName || "",
                claims: Array.isArray(authData?.claims) ? authData.claims : [],
                privileges: Array.isArray(authData?.privileges) ? authData.privileges : [],
                expires: authData?.expires || null,
                expiresString: authData?.expiresString || ""
            };

            console.log(currentUser);

            if (token) {
                storage.setItem(accessTokenKey, token);
            }

            if (refreshToken) {
                storage.setItem(refreshTokenKey, refreshToken);
            }

            storage.setItem(currentUserKey, JSON.stringify(currentUser));
        },
        clearToken() {
            clearStorage(localStorage);
            clearStorage(sessionStorage);
        },
        getToken() {
            return getAccessToken();
        },
        getCurrentUser() {
            return getCurrentUser();
        },
        getRefreshToken() {
            return getPrimaryStorage().getItem(refreshTokenKey) || "";
        },
        isSessionExpired() {
            return isCurrentUserExpired(getStoredCurrentUser());
        },
        resolveDefaultAdminPath() {
            return resolveDefaultAdminPath(getCurrentUser());
        }
    };

    apiClient.Detete = apiClient.Delete;
    window.apiClient = apiClient;
    bootstrapAuthSession();
})(window);
