
(() => {
    "use strict";

    const loginApiUrl = window.appUrl("/api/auth/login");
    const loginForm = document.getElementById("loginForm");

    if (!loginForm || !window.apiClient) {
        return;
    }

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberMeInput = document.getElementById("rememberMe");
    const loginButton = document.getElementById("loginButton");
    const notifier = window.appNotifier;

    function getTokenFromResponse(response) {
        return response?.accessToken
            || response?.access_token
            || response?.token
            || response?.data?.accessToken
            || response?.data?.access_token
            || response?.data?.token
            || response?.resultObj?.accessToken
            || response?.resultObj?.access_token
            || response?.resultObj?.token
            || response?.ResultObj?.accessToken
            || response?.ResultObj?.access_token
            || response?.ResultObj?.token
            || "";
    }

    function getAuthPayload(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response;
    }

    function persistAuthSession(authPayload, useSessionStorage) {
        if (typeof apiClient.setAuthSession === "function") {
            apiClient.setAuthSession(authPayload, useSessionStorage);
            return;
        }

        const token = authPayload?.access_token || authPayload?.accessToken || authPayload?.token || "";
        const refreshToken = authPayload?.refresh_token || authPayload?.refreshToken || "";
        const currentUser = {
            userId: authPayload?.userId || 0,
            username: authPayload?.username || "",
            fullName: authPayload?.fullName || "",
            claims: Array.isArray(authPayload?.claims) ? authPayload.claims : [],
            privileges: Array.isArray(authPayload?.privileges) ? authPayload.privileges : [],
            expires: authPayload?.expires || null,
            expiresString: authPayload?.expiresString || ""
        };
        const storage = useSessionStorage ? sessionStorage : localStorage;

        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("currentUser");

        if (token) {
            storage.setItem("accessToken", token);
        }

        if (refreshToken) {
            storage.setItem("refreshToken", refreshToken);
        }

        storage.setItem("currentUser", JSON.stringify(currentUser));
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

    function resolveDefaultAdminPath(authPayload) {
        const privilegeSet = buildPrivilegeSet(authPayload?.privileges);
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

    async function login(event) {
        event.preventDefault();

        const payload = {
            grant_type: "password",
            refresh_token: "",
            client_id: "HM",
            client_secret:"b0udcdl8k80cqiyt63uq",
            username: usernameInput.value.trim(),
            password: passwordInput.value
        };

        if (!payload.username || !payload.password) {
            notifier?.error("Vui lòng nhập tên đăng nhập và mật khẩu.");
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Đang đăng nhập...";

        try {
            const response = await apiClient.Post(loginApiUrl, payload);
            if (response.statusCode == 200) {
                const authPayload = getAuthPayload(response);
                const token = getTokenFromResponse(response);

                if (token) {
                    persistAuthSession(authPayload, !rememberMeInput.checked);
                }

                notifier?.redirectWithNotification(resolveDefaultAdminPath(authPayload), "Chào mừng " + authPayload.username + " đã quay trở lại với hệ thống", "success");
                return;
            }

            notifier?.error(response.message || response.Message);
        } catch (error) {
            notifier?.error(error?.message || "Đăng nhập thất bại.");
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Đăng nhập";
        }
    }

    loginForm.addEventListener("submit", login);
})();
