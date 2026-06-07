
(function (window, document) {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const form = document.getElementById("changePasswordForm");
    const submitButton = document.getElementById("changePasswordSubmitButton");

    if (!form || !submitButton) {
        return;
    }

    const session = window.webAppClientAuth?.getSession?.() || null;
    if (!session?.accessToken) {
        window.appNotifier?.redirectWithNotification("/Auth/Login", "Vui lòng đăng nhập để đổi mật khẩu.", "warning");
        return;
    }

    document.addEventListener("click", event => {
        const button = event.target.closest("[data-password-toggle]");
        if (!button) {
            return;
        }

        event.preventDefault();

        const inputId = button.getAttribute("data-password-toggle");
        const input = inputId ? document.getElementById(inputId) : null;
        const icon = button.querySelector("i");
        if (!input || !icon) {
            return;
        }

        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        button.setAttribute("aria-label", isHidden ? "Ẩn mật khẩu" : "Hiện mật khẩu");
        button.setAttribute("aria-pressed", isHidden ? "true" : "false");
        icon.className = isHidden ? "fa fa-eye-slash" : "fa fa-eye";
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const oldPassword = String(form.oldPassword?.value || "");
        const newPassword = String(form.newPassword?.value || "");
        const confirmPassword = String(form.confirmPassword?.value || "");

        if (!oldPassword || !newPassword || !confirmPassword) {
            window.appNotifier?.warning("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (newPassword.length < 6) {
            window.appNotifier?.warning("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }

        if (newPassword !== confirmPassword) {
            window.appNotifier?.warning("Xác nhận mật khẩu mới không khớp.");
            return;
        }

        submitButton.disabled = true;

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/usersystem/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const data = await response.json();
            const statusCode = Number(data?.statusCode ?? data?.StatusCode ?? response.status);
            const message = data?.message || data?.Message || "Đổi mật khẩu thất bại.";

            if (!response.ok || statusCode >= 400) {
                throw new Error(message);
            }

            form.reset();
            window.appNotifier?.success(message, 3000);
        } catch (error) {
            window.appNotifier?.error(error?.message || "Đổi mật khẩu thất bại.");
        } finally {
            submitButton.disabled = false;
        }
    });
})(window, document);
