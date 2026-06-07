
(() => {
    "use strict";

    const hotelManagerRoleId = 86;
    const registerApiUrl = window.appUrl("/api/auth/register-admin");
    const registerForm = document.getElementById("registerForm");

    if (!registerForm) {
        return;
    }

    const userNameInput = document.getElementById("userName");
    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const phoneNumberInput = document.getElementById("phoneNumber");
    const addressInput = document.getElementById("address");
    const passwordInput = document.getElementById("password");
    const repeatPasswordInput = document.getElementById("repeatPassword");
    const registerButton = document.getElementById("registerButton");
    const notifier = window.appNotifier;

    function buildPayload() {
        return {
            id: 0,
            userName: userNameInput.value.trim(),
            fullName: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            phoneNumber: phoneNumberInput.value.trim(),
            address: addressInput.value.trim(),
            password: passwordInput.value,
            active: 0,
            isAdministrator: false,
            backgroundImage: "user.png",
            roleIds: [hotelManagerRoleId]
        };
    }

    function validatePayload(payload, repeatPassword) {
        if (!payload.userName || !payload.fullName || !payload.email || !payload.password) {
            return "Vui lòng nhập đầy đủ thông tin bắt buộc.";
        }

        if (payload.password.length < 6) {
            return "Mật khẩu phải có ít nhất 6 kí tự.";
        }

        if (payload.password !== repeatPassword) {
            return "Mật khẩu nhập lại không khớp.";
        }

        return "";
    }

    function toFormData(payload) {
        const formData = new FormData();

        formData.append("Id", payload.id.toString());
        formData.append("UserName", payload.userName);
        formData.append("FullName", payload.fullName);
        formData.append("Email", payload.email);
        formData.append("PhoneNumber", payload.phoneNumber);
        formData.append("Address", payload.address);
        formData.append("Password", payload.password);
        formData.append("Active", payload.active.toString());
        formData.append("IsAdministrator", payload.isAdministrator.toString());
        formData.append("backgroundImage", payload.backgroundImage);

        payload.roleIds.forEach((roleId) => {
            formData.append("RoleIds", roleId.toString());
        });

        return formData;
    }

    async function register(event) {
        event.preventDefault();

        const payload = buildPayload();
        const validationMessage = validatePayload(payload, repeatPasswordInput.value);

        if (validationMessage) {
            notifier?.error(validationMessage);
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = "Đang tạo tài khoản...";

        try {
            const response = await fetch(registerApiUrl, {
                method: "POST",
                body: toFormData(payload)
            });

            const contentType = response.headers.get("content-type") || "";
            const responseData = contentType.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok || (responseData?.statusCode || 200) >= 400) {
                throw new Error(responseData?.message || responseData?.Message || "Đăng kí thất bại.");
            }

            notifier?.redirectWithNotification("/Auth/Login", "Tạo tài khoản thành công, phải chờ quản trị viên duyệt.", "success");
        } catch (error) {
            notifier?.error(error?.message || "Đăng kí thất bại.");
        } finally {
            registerButton.disabled = false;
            registerButton.textContent = "Tạo tài khoản";
        }
    }

    registerForm.addEventListener("submit", register);
})();
