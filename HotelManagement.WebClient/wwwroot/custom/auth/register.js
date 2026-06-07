(function (window, document) {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const form = document.getElementById("registerForm");
    const submitButton = document.getElementById("registerSubmitButton");

    if (!form || !submitButton) {
        return;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const fullName = String(form.fullName?.value || "").trim();
        const username = String(form.username?.value || "").trim();
        const email = String(form.email?.value || "").trim();
        const phoneNumber = String(form.phoneNumber?.value || "").trim();
        const address = String(form.address?.value || "").trim();
        const password = String(form.password?.value || "");
        const confirmPassword = String(form.confirmPassword?.value || "");

        if (!fullName || !username || !email || !phoneNumber || !address || !password || !confirmPassword) {
            window.appNotifier?.warning("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (password.length < 6) {
            window.appNotifier?.warning("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            window.appNotifier?.warning("Mật khẩu xác nhận không khớp.");
            return;
        }

        submitButton.disabled = true;

        try {
            const payload = new FormData();
            payload.append("UserName", username);
            payload.append("FullName", fullName);
            payload.append("Email", email);
            payload.append("PhoneNumber", phoneNumber);
            payload.append("Address", address);
            payload.append("Password", password);
            payload.append("Active", "1");
            payload.append("backgroundImage", "user.png");
            payload.append("RoleIds", "90");

            const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
                method: "POST",
                body: payload
            });

            const data = await response.json();
            const statusCode = Number(data?.statusCode ?? data?.StatusCode ?? response.status);
            const message = data?.message || data?.Message || "Đăng ký thất bại.";

            if (!response.ok || statusCode >= 400) {
                throw new Error(message);
            }

            window.appNotifier?.redirectWithNotification("/Auth/Login", "Đăng ký thành công", "success");
        } catch (error) {
            window.appNotifier?.error(error?.message || "Đăng ký thất bại.");
        } finally {
            submitButton.disabled = false;
        }
    });
})(window, document);
