(() => {
    "use strict";

    const page = {
        roomApiUrl: window.appUrl("/api/admin/room"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("roomKeyword"),
            typeFilter: document.getElementById("roomTypeFilter"),
            statusFilter: document.getElementById("roomStatusFilter"),
            sortBy: document.getElementById("roomSortBy"),
            sortDesc: document.getElementById("roomSortDesc"),
            itemsPerPage: document.getElementById("roomItemsPerPage"),
            searchButton: document.getElementById("roomSearchButton"),
            resetButton: document.getElementById("roomResetButton"),
            tableBody: document.getElementById("roomTableBody"),
            pagination: document.getElementById("roomPagination"),
            summary: document.getElementById("roomSummary"),
            paginationInfo: document.getElementById("roomPaginationInfo"),
            totalCount: document.getElementById("roomTotalCount"),
            availableCount: document.getElementById("roomAvailableCount"),
            occupiedCount: document.getElementById("roomOccupiedCount"),
            maintenanceCount: document.getElementById("roomMaintenanceCount")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("roomItemsPerPage")?.value) || 10,
            keyword: "",
            roomTypeId: "",
            roomStatusId: "",
            sortBy: document.getElementById("roomSortBy")?.value || "id",
            sortDesc: document.getElementById("roomSortDesc")?.value === "true",
            totalRows: 0,
            roomTypes: [],
            roomStatuses: [],
            rooms: []
        }
    };

    const requiredElements = [
        page.elements.keyword,
        page.elements.typeFilter,
        page.elements.statusFilter,
        page.elements.sortBy,
        page.elements.sortDesc,
        page.elements.itemsPerPage,
        page.elements.searchButton,
        page.elements.resetButton,
        page.elements.tableBody,
        page.elements.pagination,
        page.elements.summary,
        page.elements.paginationInfo
    ];

    if (!window.apiClient || requiredElements.some(element => !element)) {
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

    page.formatValue = function formatValue(value) {
        return value === null || value === undefined || value === "" ? "-" : value;
    };

    page.formatCurrency = function formatCurrency(value) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
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

    page.renderOptions = function renderOptions(selectElement, items, includeAllLabel) {
        const prefix = includeAllLabel ? `<option value="">${includeAllLabel}</option>` : "";
        selectElement.innerHTML = `${prefix}${items.map(item => `<option value="${item.id}">${item.name}</option>`).join("")}`;
    };

    page.loadLookups = async function loadLookups() {
        const [typesResponse, statusesResponse] = await Promise.all([
            apiClient.Get(`${page.roomApiUrl}/types`, { showLoading: false }),
            apiClient.Get(`${page.roomApiUrl}/statuses`, { showLoading: false })
        ]);

        page.state.roomTypes = (page.getResultObject(typesResponse) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.name ?? item?.Name ?? ""
        }));

        page.state.roomStatuses = (page.getResultObject(statusesResponse) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.name ?? item?.Name ?? ""
        }));

        page.renderOptions(page.elements.typeFilter, page.state.roomTypes, "Tất cả");
        page.renderOptions(page.elements.statusFilter, page.state.roomStatuses, "Tất cả");
    };

    page.syncStateFromFilters = function syncStateFromFilters(resetPage) {
        page.state.keyword = page.elements.keyword.value.trim();
        page.state.roomTypeId = page.elements.typeFilter.value || "";
        page.state.roomStatusId = page.elements.statusFilter.value || "";
        page.state.sortBy = page.elements.sortBy.value || "id";
        page.state.sortDesc = page.elements.sortDesc.value === "true";
        page.state.itemsPerPage = Number(page.elements.itemsPerPage.value) || 10;

        if (resetPage) {
            page.state.page = 1;
        }
    };

    page.buildQueryString = function buildQueryString() {
        return new URLSearchParams({
            page: String(page.state.page),
            itemsPerPage: String(page.state.itemsPerPage),
            keyword: page.state.keyword,
            roomTypeId: page.state.roomTypeId,
            roomStatusId: page.state.roomStatusId,
            sortBy: page.state.sortBy,
            sortDesc: String(page.state.sortDesc)
        }).toString();
    };

    page.createPaginationItem = function createPaginationItem(label, pageNumber, disabled, active) {
        return `
            <li class="page-item${disabled ? " disabled" : ""}${active ? " active" : ""}">
                <button type="button" class="page-link" data-page="${pageNumber}" ${disabled ? "disabled" : ""}>${label}</button>
            </li>`;
    };

    page.renderPagination = function renderPagination(totalRows) {
        page.state.totalRows = Number(totalRows) || 0;
        const totalPages = page.state.itemsPerPage > 0
            ? Math.max(1, Math.ceil(page.state.totalRows / page.state.itemsPerPage))
            : 1;

        page.state.page = Math.min(Math.max(1, page.state.page), totalPages);
        const startItem = page.state.totalRows === 0 ? 0 : ((page.state.page - 1) * page.state.itemsPerPage) + 1;
        const endItem = page.state.totalRows === 0 ? 0 : Math.min(page.state.page * page.state.itemsPerPage, page.state.totalRows);

        page.elements.paginationInfo.textContent = `Hiển thị ${startItem}-${endItem} trên ${page.state.totalRows} kết quả | Trang ${page.state.page}/${totalPages}`;
        page.elements.summary.textContent = `Tổng ${page.state.totalRows} phòng`;
        if (page.elements.totalCount) {
            page.elements.totalCount.textContent = String(page.state.totalRows);
        }

        const items = [page.createPaginationItem("Prev", page.state.page - 1, page.state.page <= 1, false)];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, page.state.page - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
            items.push(page.createPaginationItem(String(pageNumber), pageNumber, false, pageNumber === page.state.page));
        }

        items.push(page.createPaginationItem("Next", page.state.page + 1, page.state.page >= totalPages, false));
        page.elements.pagination.innerHTML = items.join("");
    };

    page.renderStats = function renderStats(items) {
        const counts = {
            available: 0,
            occupied: 0,
            maintenance: 0
        };

        (items || []).forEach(item => {
            const key = String(item?.roomStatusId ?? item?.RoomStatusId ?? "").toLowerCase();
            if (Object.prototype.hasOwnProperty.call(counts, key)) {
                counts[key] += 1;
            }
        });

        if (page.elements.availableCount) {
            page.elements.availableCount.textContent = String(counts.available);
        }
        if (page.elements.occupiedCount) {
            page.elements.occupiedCount.textContent = String(counts.occupied);
        }
        if (page.elements.maintenanceCount) {
            page.elements.maintenanceCount.textContent = String(counts.maintenance);
        }
    };

    page.renderRows = function renderRows(items) {
        page.state.rooms = Array.isArray(items) ? items : [];
        page.renderStats(page.state.rooms);

        if (!Array.isArray(items) || items.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">Không có phòng phù hợp.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = items.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const roomName = item?.roomName ?? item?.RoomName ?? "";
            const price = item?.price ?? item?.Price;
            const roomTypeName = item?.roomTypeName ?? item?.RoomTypeName ?? "";
            const roomStatusId = item?.roomStatusId ?? item?.RoomStatusId ?? "";
            const roomStatusName = item?.roomStatusName ?? item?.RoomStatusName ?? "";
            const statusClass = page.normalizeStatusClass(roomStatusId);

            return `
                <tr>
                    <td>#${id}</td>
                    <td>${page.formatValue(roomName)}</td>
                    <td>${page.formatCurrency(price)}</td>
                    <td>${page.formatValue(roomTypeName)}</td>
                    <td>
                        <div class="room-status-indicator ${statusClass}">
                            <span class="room-status-dot"></span>
                            <span class="room-status-text">${page.formatValue(roomStatusName)}</span>
                        </div>
                    </td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-info btn-sm" data-action="detail" data-id="${id}" title="Chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning btn-sm" data-action="status" data-id="${id}" title="Trạng thái">
                            <i class="fas fa-random"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${id}" title="Xóa">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        }).join("");
    };

    page.renderLoading = function renderLoading() {
        page.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
        page.elements.paginationInfo.textContent = "Đang tải dữ liệu...";
    };

    page.loadRooms = async function loadRooms() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderLoading();

        try {
            const response = await apiClient.Get(`${page.roomApiUrl}?${page.buildQueryString()}`);
            const result = page.getResultObject(response);
            const items = result?.data ?? result?.Data ?? [];
            const totalRows = result?.totalRows ?? result?.TotalRows ?? items.length;
            const currentPage = result?.currentPage ?? result?.CurrentPage ?? page.state.page;
            page.state.page = Number(currentPage) || page.state.page;
            page.renderRows(items);
            page.renderPagination(totalRows);
        } catch (error) {
            console.error("Load rooms failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">Không thể tải danh sách phòng.</td>
                </tr>`;
            page.elements.summary.textContent = "Tải dữ liệu thất bại";
            page.elements.paginationInfo.textContent = "Không thể tải dữ liệu.";
            page.renderStats([]);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách phòng.");
        }
    };

    page.resetFilters = function resetFilters() {
        page.elements.keyword.value = "";
        page.elements.typeFilter.value = "";
        page.elements.statusFilter.value = "";
        page.elements.sortBy.value = "id";
        page.elements.sortDesc.value = "false";
        page.elements.itemsPerPage.value = "10";
        page.syncStateFromFilters(true);
        page.loadRooms();
    };

    page.bindEvents = function bindEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadRooms();
        });

        page.elements.resetButton.addEventListener("click", page.resetFilters);

        [page.elements.typeFilter, page.elements.statusFilter, page.elements.sortBy, page.elements.sortDesc, page.elements.itemsPerPage].forEach(element => {
            element.addEventListener("change", () => {
                page.syncStateFromFilters(true);
                page.loadRooms();
            });
        });

        page.elements.keyword.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                page.syncStateFromFilters(true);
                page.loadRooms();
            }
        });

        page.elements.pagination.addEventListener("click", event => {
            const button = event.target.closest("[data-page]");
            if (!button) {
                return;
            }

            const targetPage = Number(button.dataset.page);
            const totalPages = page.state.itemsPerPage > 0 ? Math.max(1, Math.ceil(page.state.totalRows / page.state.itemsPerPage)) : 1;
            if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage > totalPages || targetPage === page.state.page) {
                return;
            }

            page.state.page = targetPage;
            page.loadRooms();
        });

        page.elements.tableBody.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const roomId = Number(button.dataset.id);
            if (!roomId) {
                return;
            }

            if (action === "detail" && typeof page.openRoomDetail === "function") {
                page.openRoomDetail(roomId);
            }

            if (action === "status" && typeof page.openRoomStatusModal === "function") {
                page.openRoomStatusModal(roomId);
            }

            if (action === "delete" && typeof page.openRoomDeleteModal === "function") {
                page.openRoomDeleteModal(roomId);
            }
        });
    };

    window.roomPage = page;

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadLookups();
            page.bindEvents();
            page.syncStateFromFilters(true);
            await page.loadRooms();
        } catch (error) {
            console.error("Room page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn hình phòng.");
        }
    });
})();
