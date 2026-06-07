(() => {
    "use strict";

    const page = {
        apiUrl: window.appUrl("/api/admin/usersystem/me"),
        notifier: window.appNotifier,
        elements: {
            heroTitle: document.getElementById("informationHeroTitle"),
            heroSubtitle: document.getElementById("informationHeroSubtitle"),
            avatar: document.getElementById("informationAvatar"),
            statusText: document.getElementById("informationStatusText"),
            loading: document.getElementById("informationLoading"),
            content: document.getElementById("informationContent"),
            errorState: document.getElementById("informationErrorState"),
            fullName: document.getElementById("informationFullName"),
            userName: document.getElementById("informationUserName"),
            email: document.getElementById("informationEmail"),
            phoneNumber: document.getElementById("informationPhoneNumber"),
            createDate: document.getElementById("informationCreateDate"),
            active: document.getElementById("informationActive"),
            address: document.getElementById("informationAddress"),
            roles: document.getElementById("informationRoles")
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

    page.formatValue = function formatValue(value, fallback = "-") {
        return value === null || value === undefined || value === "" ? fallback : value;
    };

    page.resolveAvatarUrl = function resolveAvatarUrl(backgroundImage) {
        const imagePath = String(backgroundImage || "").trim();
        if (!imagePath) {
            return "/images/undraw_profile.svg";
        }

        if (/^https?:\/\//i.test(imagePath)) {
            return imagePath;
        }

        if (imagePath.startsWith("/")) {
            return imagePath;
        }

        return `/images/${imagePath.replace(/^\/+/, "")}`;
    };

    page.renderRoles = function renderRoles(roleNames) {
        const roles = Array.isArray(roleNames) ? roleNames.filter(Boolean) : [];
        if (!roles.length) {
            page.elements.roles.innerHTML = '<div class="information-empty w-100">Chưa có vai trò nào được gán.</div>';
            return;
        }

        page.elements.roles.innerHTML = roles
            .map(role => `<span class="information-role-badge">${role}</span>`)
            .join("");
    };

    page.renderStatus = function renderStatus(active) {
        const isActive = Number(active) === 1;
        page.elements.active.innerHTML = `
            <span class="information-status-badge ${isActive ? "is-active" : "is-inactive"}">
                ${isActive ? "Đang hoạt động" : "Chưa kích hoạt"}
            </span>`;
    };

    page.renderUserInformation = function renderUserInformation(detail) {
        const fullName = detail?.fullName ?? detail?.FullName ?? "";
        const userName = detail?.userName ?? detail?.UserName ?? "";
        const email = detail?.email ?? detail?.Email ?? "";
        const phoneNumber = detail?.phoneNumber ?? detail?.PhoneNumber ?? "";
        const createDate = detail?.createDate ?? detail?.CreateDate ?? "";
        const address = detail?.address ?? detail?.Address ?? "";
        const backgroundImage = detail?.backgroundImage ?? detail?.BackgroundImage ?? "";
        const roleNames = detail?.roleNames ?? detail?.RoleNames ?? [];
        const active = detail?.active ?? detail?.Active ?? 0;

        page.elements.heroTitle.textContent = page.formatValue(fullName || userName, "Chưa có tên hiển thị");
        page.elements.heroSubtitle.textContent = `Tên đăng nhập: ${page.formatValue(userName)} | Email: ${page.formatValue(email)}`;
        page.elements.fullName.textContent = page.formatValue(fullName);
        page.elements.userName.textContent = page.formatValue(userName);
        page.elements.email.textContent = page.formatValue(email);
        page.elements.phoneNumber.textContent = page.formatValue(phoneNumber);
        page.elements.createDate.textContent = page.formatValue(createDate);
        page.elements.address.textContent = page.formatValue(address, "Chưa cập nhật địa chỉ");
        page.elements.statusText.textContent = "Đã tải hồ sơ người dùng.";

        page.elements.avatar.src = page.resolveAvatarUrl(backgroundImage);

        page.renderStatus(active);
        page.renderRoles(roleNames);

        page.elements.loading.classList.add("d-none");
        page.elements.errorState.classList.add("d-none");
        page.elements.content.classList.remove("d-none");
    };

    page.showErrorState = function showErrorState(message) {
        page.elements.statusText.textContent = "Tải hồ sơ thất bại.";
        page.elements.loading.classList.add("d-none");
        page.elements.content.classList.add("d-none");
        page.elements.errorState.classList.remove("d-none");
        page.elements.errorState.textContent = message || "Không thể tải thông tin người dùng. Vui lòng thử lại sau.";
    };

    page.loadInformation = async function loadInformation() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            const response = await apiClient.Get(page.apiUrl);
            const detail = page.getResultObject(response);
            page.renderUserInformation(detail);
        } catch (error) {
            console.error("Load user information failed:", error);
            page.showErrorState(error?.data?.message || error?.data?.Message || error?.message);
            page.notifier?.error(error?.data?.message || error?.data?.Message || error?.message || "Không thể tải thông tin người dùng.");
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        page.elements.avatar.addEventListener("error", () => {
            page.elements.avatar.src = "/images/undraw_profile.svg";
        }, { once: true });

        page.loadInformation();
    });
})();
