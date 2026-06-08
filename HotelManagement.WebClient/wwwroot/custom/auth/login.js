(function (window, document) {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const clientId = "HM";
    const clientSecret = "b0udcdl8k80cqiyt63uq";
    const form = document.getElementById("loginForm");
    const submitButton = document.getElementById("loginSubmitButton");
    const passwordInput = document.getElementById("loginPassword");
    const passwordToggle = document.getElementById("loginPasswordToggle");
    const passwordToggleIcon = document.getElementById("loginPasswordToggleIcon");
    const fallbackRedirectUrl = "/Home/Index";

    if (!form || !submitButton) {
        return;
    }

    function getSafeReturnUrl() {
        const query = new URLSearchParams(window.location.search);
        const returnUrl = String(query.get("returnUrl") || "").trim();

        if (!returnUrl || !returnUrl.startsWith("/") || returnUrl.startsWith("//") || returnUrl.startsWith("/\\")) {
            return fallbackRedirectUrl;
        }

        return returnUrl;
    }

    if (passwordInput && passwordToggle && passwordToggleIcon) {
        passwordToggle.addEventListener("click", () => {
            const isPasswordHidden = passwordInput.type === "password";

            passwordInput.type = isPasswordHidden ? "text" : "password";
            passwordToggle.setAttribute("aria-pressed", isPasswordHidden ? "true" : "false");
            passwordToggle.setAttribute("aria-label", isPasswordHidden ? "An mat khau" : "Hien mat khau");
            passwordToggleIcon.className = isPasswordHidden ? "fa fa-eye-slash" : "fa fa-eye";
        });
    }

    if (window.webAppClientAuth?.getSession()?.accessToken) {
        window.location.replace(getSafeReturnUrl());
        return;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const username = String(form.username?.value || "").trim();
        const password = String(form.password?.value || "");

        if (!username || !password) {
            window.appNotifier?.warning("Vui long nhap ten dang nhap va mat khau.");
            return;
        }

        submitButton.disabled = true;

        try {
            const payload = {
                grant_type: "password",
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: "",
                username,
                password
            };

            const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            const statusCode = Number(data?.statusCode ?? data?.StatusCode ?? response.status);
            const result = data?.resultObj ?? data?.ResultObj ?? null;
            const message = data?.message || data?.Message || "Dang nhap that bai.";

            if (!response.ok || statusCode >= 400 || !result?.accessToken) {
                throw new Error(message || "Dang nhap that bai.");
            }

            const authSession = {
                userId: result.userId ?? result.UserId ?? 0,
                customerId: result.customerId ?? result.CustomerId ?? null,
                fullName: result.fullName ?? result.FullName ?? "",
                username: result.username ?? result.Username ?? "",
                email: result.email ?? result.Email ?? "",
                phoneNumber: result.phoneNumber ?? result.PhoneNumber ?? "",
                accessToken: result.accessToken ?? result.AccessToken ?? "",
                refreshToken: result.refreshToken ?? result.RefreshToken ?? "",
                expires: result.expires ?? result.Expires ?? "",
                privileges: result.privileges ?? result.Privileges ?? []
            };

            const returnUrl = getSafeReturnUrl();

            window.webAppClientAuth?.setSession(authSession);
            window.webAppClientAuth?.updateNavbar();
            window.appNotifier?.redirectWithNotification(returnUrl, "Dang nhap thanh cong", "success");
        } catch (error) {
            window.appNotifier?.error(error?.message || "Dang nhap that bai.");
        } finally {
            submitButton.disabled = false;
        }
    });
})(window, document);
