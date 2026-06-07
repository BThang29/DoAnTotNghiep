(() => {
    "use strict";

    const page = {
        roomApiUrl: window.appUrl("/api/admin/room"),
        reviewApiUrl: window.appUrl("/api/admin/review"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("reviewCustomerKeyword"),
            typeFilter: document.getElementById("reviewCustomerTypeFilter"),
            itemsPerPage: document.getElementById("reviewCustomerItemsPerPage"),
            searchButton: document.getElementById("reviewCustomerSearchButton"),
            resetButton: document.getElementById("reviewCustomerResetButton"),
            customerList: document.getElementById("reviewCustomerList"),
            pagination: document.getElementById("reviewCustomerPagination"),
            summary: document.getElementById("reviewCustomerSummary"),
            paginationInfo: document.getElementById("reviewCustomerPaginationInfo"),
            historySummary: document.getElementById("reviewHistorySummary"),
            selectedName: document.getElementById("reviewSelectedCustomerName"),
            selectedMeta: document.getElementById("reviewSelectedCustomerMeta"),
            reviewCount: document.getElementById("reviewCount"),
            reviewAverageRating: document.getElementById("reviewAverageRating"),
            reviewLatestDate: document.getElementById("reviewLatestDate")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("reviewCustomerItemsPerPage")?.value) || 5,
            keyword: "",
            roomTypeId: "",
            totalRows: 0,
            roomTypes: [],
            rooms: [],
            selectedRoom: null
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

    page.formatValue = function formatValue(value) {
        return value === null || value === undefined || value === "" ? "-" : value;
    };

    page.formatDate = function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return page.formatValue(value);
        }

        return date.toLocaleDateString("vi-VN");
    };

    page.renderOptions = function renderOptions(selectElement, items, includeAllLabel) {
        const prefix = includeAllLabel ? `<option value="">${includeAllLabel}</option>` : "";
        selectElement.innerHTML = `${prefix}${items.map(item => `<option value="${item.id}">${item.name}</option>`).join("")}`;
    };

    page.loadRoomTypes = async function loadRoomTypes() {
        const response = await apiClient.Get(`${page.roomApiUrl}/types`, { showLoading: false });
        page.state.roomTypes = (page.getResultObject(response) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.details ?? item?.Details ?? item?.name ?? item?.Name ?? ""
        }));

        page.renderOptions(page.elements.typeFilter, page.state.roomTypes, "Tat ca");
    };

    page.syncStateFromFilters = function syncStateFromFilters(resetPage) {
        page.state.keyword = page.elements.keyword.value.trim();
        page.state.roomTypeId = page.elements.typeFilter.value || "";
        page.state.itemsPerPage = Number(page.elements.itemsPerPage.value) || 5;

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
            sortBy: "roomName",
            sortDesc: "false"
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

        page.elements.paginationInfo.textContent = `Hien thi ${startItem}-${endItem} tren ${page.state.totalRows}`;
        page.elements.summary.textContent = `Tong ${page.state.totalRows} phong`;

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

    page.renderRoomRows = function renderRoomRows(items) {
        page.state.rooms = Array.isArray(items) ? items : [];

        if (!Array.isArray(items) || items.length === 0) {
            page.elements.customerList.innerHTML = `<div class="text-center text-muted py-5">Khong co phong phu hop.</div>`;
            return;
        }

        page.elements.customerList.innerHTML = items.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const roomName = item?.roomName ?? item?.RoomName ?? "";
            const roomTypeName = item?.roomTypeName ?? item?.RoomTypeName ?? item?.roomTypeId ?? item?.RoomTypeId ?? "";
            const roomStatusName = item?.roomStatusName ?? item?.RoomStatusName ?? item?.roomStatusId ?? item?.RoomStatusId ?? "";
            const isActive = Number(page.state.selectedRoom?.id ?? page.state.selectedRoom?.Id) === Number(id);

            return `
                <div class="customer-list-item${isActive ? " is-active" : ""}" data-customer-id="${id}">
                    <div class="customer-list-item-main">
                        <div>
                            <div class="customer-list-item-title">${page.formatValue(roomName)}</div>
                            <div class="customer-list-item-meta">
                                <div>Ma phong: #${page.formatValue(id)}</div>
                                <div>Loai: ${page.formatValue(roomTypeName)}</div>
                                <div>Trạng thái: ${page.formatValue(roomStatusName)}</div>
                            </div>
                        </div>
                        <div class="customer-list-item-action">
                            <button type="button" class="btn btn-outline-primary btn-sm" data-action="select" data-id="${id}">Chon</button>
                        </div>
                    </div>
                </div>`;
        }).join("");
    };

    page.renderLoading = function renderLoading() {
        page.elements.customerList.innerHTML = `<div class="text-center text-muted py-5">Dang tai danh sach phong...</div>`;
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
            page.renderRoomRows(items);
            page.renderPagination(totalRows);

            if (page.state.selectedRoom) {
                const matched = items.find(item => Number(item?.id ?? item?.Id) === Number(page.state.selectedRoom?.id ?? page.state.selectedRoom?.Id));
                if (matched) {
                    page.state.selectedRoom = matched;
                    page.renderRoomRows(items);
                }
            }
        } catch (error) {
            console.error("Load review rooms failed:", error);
            page.elements.customerList.innerHTML = `<div class="text-center text-danger py-5">Không thể tải danh sách phòng.</div>`;
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách phòng.");
        }
    };

    page.setSelectedRoom = function setSelectedRoom(room) {
        page.state.selectedRoom = room;

        if (!room) {
            page.elements.selectedName.textContent = "Chua chon phong";
            page.elements.selectedMeta.textContent = "Chọn một phòng từ danh sách bên trái để tải lịch sử bình luận.";
            return;
        }

        const roomId = room?.id ?? room?.Id ?? "";
        const roomTypeName = room?.roomTypeName ?? room?.RoomTypeName ?? room?.roomTypeId ?? room?.RoomTypeId ?? "";
        const roomStatusName = room?.roomStatusName ?? room?.RoomStatusName ?? room?.roomStatusId ?? room?.RoomStatusId ?? "";
        page.elements.selectedName.textContent = room?.roomName ?? room?.RoomName ?? "-";
        page.elements.selectedMeta.textContent = `Mã phòng: #${page.formatValue(roomId)} | Loại: ${page.formatValue(roomTypeName)} | Trạng thái: ${page.formatValue(roomStatusName)}`;
        page.renderRoomRows(page.state.rooms);
    };

    page.resetFilters = function resetFilters() {
        page.elements.keyword.value = "";
        page.elements.typeFilter.value = "";
        page.elements.itemsPerPage.value = "5";
        page.syncStateFromFilters(true);
        page.loadRooms();
    };

    page.bindEvents = function bindEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadRooms();
        });

        page.elements.resetButton.addEventListener("click", page.resetFilters);

        [page.elements.typeFilter, page.elements.itemsPerPage].forEach(element => {
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

        page.elements.customerList.addEventListener("click", event => {
            const button = event.target.closest("[data-action='select']");
            const itemElement = event.target.closest("[data-customer-id]");
            const roomId = Number(button?.dataset.id || itemElement?.dataset.customerId);
            if (!roomId) {
                return;
            }

            const room = page.state.rooms.find(item => Number(item?.id ?? item?.Id) === roomId);
            if (!room) {
                return;
            }

            page.setSelectedRoom(room);
            if (typeof page.loadReviewHistory === "function") {
                page.loadReviewHistory(roomId);
            }
        });
    };

    window.customerReviewPage = page;

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadRoomTypes();
            page.bindEvents();
            page.syncStateFromFilters(true);
            await page.loadRooms();
        } catch (error) {
            console.error("Review page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn hình review.");
        }
    });
})();
