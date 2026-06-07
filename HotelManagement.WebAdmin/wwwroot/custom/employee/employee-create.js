(() => {
    "use strict";

    const page = {
        employeeApiUrl: window.appUrl("/api/admin/employee"),
        roleApiUrl: window.appUrl("/api/admin/role/getlistroles"),
        notifier: window.appNotifier,
        elements: {
            userName: document.getElementById("employeeCreateUserName"),
            fullName: document.getElementById("employeeCreateFullName"),
            email: document.getElementById("employeeCreateEmail"),
            phoneNumber: document.getElementById("employeeCreatePhoneNumber"),
            password: document.getElementById("employeeCreatePassword"),
            backgroundImage: document.getElementById("employeeCreateBackgroundImage"),
            address: document.getElementById("employeeCreateAddress"),
            roleIds: document.getElementById("employeeCreateRoleIds"),
            submitButton: document.getElementById("employeeCreateSubmitButton")
        },
        state: {
            roleOptions: [],
            isSubmitting: false,
            canViewRoles: false
        }
    };

    if (!window.apiClient || Object.values(page.elements).some(element => !element)) {
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

    page.getResultObject = function getResultObject(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response?.Data
            || response;
    };

    page.getCurrentUserPrivileges = function getCurrentUserPrivileges() {
        const currentUser = apiClient.getCurrentUser?.();
        return Array.isArray(currentUser?.privileges) ? currentUser.privileges : [];
    };

    page.hasAnyPrivilege = function hasAnyPrivilege(privileges) {
        const currentPrivileges = new Set(
            page.getCurrentUserPrivileges()
                .filter(Boolean)
                .map(item => String(item).trim())
        );

        return (privileges || []).some(item => currentPrivileges.has(String(item)));
    };

    page.escapeHtml = function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    page.renderRoleOptions = function renderRoleOptions() {
        page.elements.roleIds.removeAttribute("multiple");
        page.elements.roleIds.removeAttribute("size");
        page.elements.roleIds.disabled = !page.state.canViewRoles;
        page.elements.roleIds.innerHTML = `${page.state.canViewRoles ? `<option value="">Chọn vai trò</option>` : `<option value="">Khong co quyen xem vai tro</option>`}` + page.state.roleOptions
            .map(item => `<option value="${item.id}">${page.escapeHtml(item.name)}</option>`)
            .join("");
    };

    page.loadRoleOptions = async function loadRoleOptions() {
        if (!page.state.canViewRoles) {
            page.state.roleOptions = [];
            page.renderRoleOptions();
            return;
        }

        const response = await apiClient.Get(`${page.roleApiUrl}?page=1&itemsPerPage=200&sortBy=id&sortDesc=false`, { showLoading: false });
        const result = page.getResultObject(response);
        const roleItems = Array.isArray(result?.data ?? result?.Data)
            ? (result?.data ?? result?.Data)
            : Array.isArray(result)
                ? result
                : [];

        page.state.roleOptions = roleItems
            .map(item => ({
                id: item?.id ?? item?.Id ?? 0,
                name: item?.name ?? item?.Name ?? ""
            }))
            .filter(item => item.id && item.name && item.name.toLowerCase() !== "customer");

        page.renderRoleOptions();
    };

    page.getSelectedRoleIds = function getSelectedRoleIds() {
        const roleId = Number(page.elements.roleIds.value);
        return Number.isFinite(roleId) && roleId > 0 ? [roleId] : [];
    };

    page.buildPayload = function buildPayload() {
        return {
            userName: page.elements.userName.value.trim(),
            fullName: page.elements.fullName.value.trim(),
            email: page.elements.email.value.trim(),
            phoneNumber: page.elements.phoneNumber.value.trim(),
            address: page.elements.address.value.trim(),
            password: page.elements.password.value.trim(),
            backgroundImage: page.elements.backgroundImage.value.trim(),
            roleIds: page.getSelectedRoleIds()
        };
    };

    page.validatePayload = function validatePayload(payload) {
        if (!page.state.canViewRoles) {
            return "Tai khoan nay khong co quyen xem vai tro, khong the tao nhan vien moi.";
        }

        if (!payload.userName) {
            return "Ten dang nhap khong duoc de trong.";
        }

        if (!payload.fullName) {
            return "Ho ten khong duoc de trong.";
        }

        if (!payload.password) {
            return "Mat khau khong duoc de trong.";
        }

        if (payload.roleIds.length === 0) {
            return "Nhân viên phải có ít nhất 1 vai trò.";
        }

        return "";
    };

    page.submit = async function submit() {
        if (page.state.isSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const payload = page.buildPayload();
        const validationMessage = page.validatePayload(payload);
        if (validationMessage) {
            if (typeof page.notifier?.warning === "function") {
                page.notifier.warning(validationMessage);
            } else {
                page.notifier?.error?.(validationMessage);
            }
            return;
        }

        page.state.isSubmitting = true;
        page.elements.submitButton.disabled = true;

        try {
            await apiClient.Post(page.employeeApiUrl, payload);
            page.notifier?.redirectWithNotification("/Employee/Employees", "Tạo nhân viên thành công. Tài khoản đang ở trạng thái chờ duyệt.", "success");
        } catch (error) {
            console.error("Create employee failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tạo nhân viên.");
        } finally {
            page.state.isSubmitting = false;
            page.elements.submitButton.disabled = false;
        }
    };

    page.bindEvents = function bindEvents() {
        page.elements.submitButton.addEventListener("click", page.submit);
        [
            page.elements.userName,
            page.elements.fullName,
            page.elements.email,
            page.elements.phoneNumber,
            page.elements.password
        ].forEach(element => {
            element.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    page.submit();
                }
            });
        });
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            page.state.canViewRoles = page.hasAnyPrivilege(["ViewRole", "ManageRole"]);
            await page.loadRoleOptions();
            page.bindEvents();
        } catch (error) {
            console.error("Create employee page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn tạo nhân viên.");
        }
    });
})();
