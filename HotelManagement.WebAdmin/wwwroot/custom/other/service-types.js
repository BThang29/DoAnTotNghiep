(() => {
    "use strict";

    const page = {
        otherApiUrl: window.appUrl("/api/admin/other"),
        notifier: window.appNotifier,
        elements: {
            summary: document.getElementById("serviceTypePageSummary"),
            tableBody: document.getElementById("serviceTypePageTableBody")
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

    page.renderLoading = function renderLoading() {
        page.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
    };

    page.renderRows = function renderRows(items) {
        const serviceTypes = Array.isArray(items) ? items : [];
        page.elements.summary.textContent = `Tong ${serviceTypes.length} loai dich vu`;

        if (serviceTypes.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted">Chua co loai dich vu nao.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = serviceTypes.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const name = item?.name ?? item?.Name ?? "";
            return `
                <tr>
                    <td>#${id}</td>
                    <td><span class="other-type-badge">${name || "-"}</span></td>
                </tr>`;
        }).join("");
    };

    page.loadServiceTypes = async function loadServiceTypes() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderLoading();

        try {
            const response = await apiClient.Get(`${page.otherApiUrl}/service-types`);
            page.renderRows(page.getResultObject(response) || []);
        } catch (error) {
            console.error("Load service types failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-danger">Không thể tải danh sách loại dịch vụ.</td>
                </tr>`;
            page.elements.summary.textContent = "Tai du lieu that bai";
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách loại dịch vụ.");
        }
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadServiceTypes();
        } catch (error) {
            console.error("Service types page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn loại dịch vụ.");
        }
    });
})();
