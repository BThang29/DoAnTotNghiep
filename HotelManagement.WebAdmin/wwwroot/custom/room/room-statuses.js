(() => {
    "use strict";

    const page = {
        roomApiUrl: window.appUrl("/api/admin/room"),
        notifier: window.appNotifier,
        elements: {
            summary: document.getElementById("roomStatusPageSummary"),
            tableBody: document.getElementById("roomStatusPageTableBody")
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

    page.normalizeStatusClass = function normalizeStatusClass(statusId) {
        const key = String(statusId || "").toLowerCase();
        if (key === "available") {
            return "available";
        }

        if (key === "occupied") {
            return "occupied";
        }

        if (key === "maintenance") {
            return "maintenance";
        }

        return "";
    };

    page.renderLoading = function renderLoading() {
        page.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
    };

    page.renderRows = function renderRows(items) {
        const statuses = Array.isArray(items) ? items : [];
        page.elements.summary.textContent = `Tong ${statuses.length} trang thai phong`;

        if (statuses.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted">Chua co trang thai phong nao.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = statuses.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const name = item?.name ?? item?.Name ?? "";
            return `
                <tr>
                    <td>
                        <div class="room-status-indicator ${page.normalizeStatusClass(id)}">
                            <span class="room-status-dot"></span>
                            <span class="room-status-text">${id || "-"}</span>
                        </div>
                    </td>
                    <td>${name || "-"}</td>
                </tr>`;
        }).join("");
    };

    page.loadStatuses = async function loadStatuses() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderLoading();

        try {
            const response = await apiClient.Get(`${page.roomApiUrl}/statuses`);
            page.renderRows(page.getResultObject(response) || []);
        } catch (error) {
            console.error("Load room statuses failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-danger">Không thể tải danh sách trạng thái phòng.</td>
                </tr>`;
            page.elements.summary.textContent = "Tai du lieu that bai";
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách trạng thái phòng.");
        }
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadStatuses();
        } catch (error) {
            console.error("Room status page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn trạng thái phòng.");
        }
    });
})();
