(function (window, document) {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const form = document.getElementById("forgotPasswordForm");
    const submitButton = document.getElementById("forgotPasswordSubmitButton");

    if (!form || !submitButton) {
        return;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const email = String(form.email?.value || "").trim();

        if (!email) {
            window.appNotifier?.warning("Vui lòng nhập email.");
            return;
        }

        submitButton.disabled = true;

        try {
            const response = await fetch(`${apiBaseUrl}/api/auth/forgotpassword`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    newPassword: ""
                })
            });

            const data = await response.json();
            const statusCode = Number(data?.statusCode ?? data?.StatusCode ?? response.status);
            const message = data?.message || data?.Message || "Khôi phục mật khẩu thất bại.";

            if (!response.ok || statusCode >= 400) {
                throw new Error(message);
            }

            window.appNotifier?.redirectWithNotification("/Auth/Login", message, "success", 4000);
        } catch (error) {
            window.appNotifier?.error(error?.message || "Khôi phục mật khẩu thất bại.");
        } finally {
            submitButton.disabled = false;
        }
    });
})(window, document);
