(() => {
    "use strict";

    const page = {
        apiUrl: window.appUrl("/api/admin/usersystem/password"),
        notifier: window.appNotifier,
        elements: {
            form: document.getElementById("userSystemForm"),
            username: document.getElementById("userSystemUsername"),
            fullName: document.getElementById("userSystemFullName"),
            oldPassword: document.getElementById("userSystemOldPassword"),
            newPassword: document.getElementById("userSystemNewPassword"),
            confirmPassword: document.getElementById("userSystemConfirmPassword"),
            strengthText: document.getElementById("userSystemStrengthText"),
            statusText: document.getElementById("userSystemStatusText"),
            lastValidation: document.getElementById("userSystemLastValidation"),
            resetButton: document.getElementById("userSystemResetButton"),
            submitButton: document.getElementById("userSystemSubmitButton")
        },
        state: {
            isSubmitting: false
        }
    };

    if (!window.apiClient || !page.elements.form) {
        return;
    }

    page.ensureAuthenticated = function ensureAuthenticated() {
        const token = apiClient.getToken();
        if (token) {
            return true;
        }

        page.notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
        return false;
    };

    page.getCurrentUser = function getCurrentUser() {
        return apiClient.getCurrentUser?.() || null;
    };

    page.fillCurrentUser = function fillCurrentUser() {
        const currentUser = page.getCurrentUser();
        page.elements.username.textContent = currentUser?.username || "-";
        page.elements.fullName.textContent = currentUser?.fullName || currentUser?.username || "-";
    };

    page.resetForm = function resetForm() {
        page.elements.form.reset();
        page.elements.statusText.textContent = "Sẵn sàng cập nhật.";
        page.elements.lastValidation.textContent = "Chưa có thay đổi nào được gửi.";
        page.renderPasswordStrength();
    };

    page.getPasswordStrength = function getPasswordStrength(value) {
        const password = String(value || "");
        let score = 0;

        if (password.length >= 6) {
            score += 1;
        }

        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
            score += 1;
        }

        if (/\d/.test(password)) {
            score += 1;
        }

        if (/[^A-Za-z0-9]/.test(password)) {
            score += 1;
        }

        if (password.length >= 10) {
            score += 1;
        }

        if (!password) {
            return { text: "", className: "text-muted" };
        }

        if (score <= 2) {
            return { text: "Độ mạnh mật khẩu: yếu", className: "text-danger" };
        }

        if (score <= 4) {
            return { text: "Độ mạnh mật khẩu: trung bình", className: "text-warning" };
        }

        return { text: "Độ mạnh mật khẩu: mạnh", className: "text-success" };
    };

    page.renderPasswordStrength = function renderPasswordStrength() {
        const result = page.getPasswordStrength(page.elements.newPassword.value);
        page.elements.strengthText.className = `user-system-strength ${result.className}`;
        page.elements.strengthText.textContent = result.text;
    };

    page.buildPayload = function buildPayload() {
        return {
            oldPassword: page.elements.oldPassword.value,
            newPassword: page.elements.newPassword.value,
            confirmPassword: page.elements.confirmPassword.value
        };
    };

    page.validatePayload = function validatePayload(payload) {
        if (!payload.oldPassword) {
            return "Vui lòng nhập mật khẩu hiện tại.";
        }

        if (!payload.newPassword) {
            return "Vui lòng nhập mật khẩu mới.";
        }

        if (payload.newPassword.length < 6) {
            return "Mật khẩu mới phải có ít nhất 6 ký tự.";
        }

        if (payload.oldPassword === payload.newPassword) {
            return "Mật khẩu mới phải khác mật khẩu hiện tại.";
        }

        if (!payload.confirmPassword) {
            return "Vui lòng xác nhận mật khẩu mới.";
        }

        if (payload.newPassword !== payload.confirmPassword) {
            return "Xác nhận mật khẩu mới không khớp.";
        }

        return "";
    };

    page.submitPassword = async function submitPassword(event) {
        event.preventDefault();

        if (page.state.isSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const payload = page.buildPayload();
        const validationMessage = page.validatePayload(payload);
        if (validationMessage) {
            page.elements.lastValidation.textContent = validationMessage;
            if (typeof page.notifier?.warning === "function") {
                page.notifier.warning(validationMessage);
            } else {
                page.notifier?.error?.(validationMessage);
            }
            return;
        }

        page.state.isSubmitting = true;
        page.elements.submitButton.disabled = true;
        page.elements.resetButton.disabled = true;
        page.elements.statusText.textContent = "Đang gửi yêu cầu đổi mật khẩu...";
        page.elements.lastValidation.textContent = "Dữ liệu hợp lệ, đang gửi lên API.";

        try {
            const response = await apiClient.Put(page.apiUrl, payload);
            const isSuccess = response?.statusCode === 201
                || response?.statusCode === 200
                || response?.resultObj === true
                || response?.ResultObj === true;

            if (!isSuccess) {
                throw {
                    message: response?.message || response?.Message || "Đổi mật khẩu thất bại.",
                    data: response
                };
            }

            page.resetForm();
            page.elements.statusText.textContent = "Đổi mật khẩu thành công.";
            page.elements.lastValidation.textContent = "Mật khẩu đã được cập nhật thành công.";
            page.notifier?.success(response?.message || response?.Message || "Đổi mật khẩu thành công.");
        } catch (error) {
            console.error("Change password failed:", error);
            page.elements.statusText.textContent = "Yêu cầu bị từ chối.";
            page.elements.lastValidation.textContent = error?.data?.message || error?.data?.Message || error?.message || "Không thể đổi mật khẩu.";
            page.notifier?.error(error?.data?.message || error?.data?.Message || error?.message || "Không thể đổi mật khẩu.");
        } finally {
            page.state.isSubmitting = false;
            page.elements.submitButton.disabled = false;
            page.elements.resetButton.disabled = false;
        }
    };

    page.bindEvents = function bindEvents() {
        page.elements.form.addEventListener("submit", page.submitPassword);
        page.elements.resetButton.addEventListener("click", page.resetForm);
        page.elements.newPassword.addEventListener("input", page.renderPasswordStrength);
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.fillCurrentUser();
        page.renderPasswordStrength();
        page.bindEvents();
    });
})();
