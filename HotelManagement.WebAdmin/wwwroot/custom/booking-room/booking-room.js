(() => {
    "use strict";

    const bookingRoomApiUrl = window.appUrl("/api/admin/booking-room");
    const roomApiUrl = window.appUrl("/api/admin/room");
    const notifier = window.appNotifier;

    const keywordElement = document.getElementById("bookingRoomKeyword");
    const customerIdElement = document.getElementById("bookingRoomCustomerId");
    const roomIdElement = document.getElementById("bookingRoomRoomId");
    const sortByElement = document.getElementById("bookingRoomSortBy");
    const sortDescElement = document.getElementById("bookingRoomSortDesc");
    const itemsPerPageElement = document.getElementById("bookingRoomItemsPerPage");
    const createButtonElement = document.getElementById("bookingRoomCreateButton");
    const searchButtonElement = document.getElementById("bookingRoomSearchButton");
    const resetButtonElement = document.getElementById("bookingRoomResetButton");
    const paginationElement = document.getElementById("bookingRoomPagination");
    const summaryElement = document.getElementById("bookingRoomSummary");
    const paginationInfoElement = document.getElementById("bookingRoomPaginationInfo");
    const tableBodyElement = document.getElementById("bookingRoomTableBody");
    const detailModalElement = document.getElementById("bookingRoomDetailModal");

    const detailFields = {
        id: document.getElementById("bookingRoomDetailId"),
        dateBooking: document.getElementById("bookingRoomDetailDateBooking"),
        customerName: document.getElementById("bookingRoomDetailCustomerName"),
        customerPhone: document.getElementById("bookingRoomDetailCustomerPhone"),
        customerId: document.getElementById("bookingRoomDetailCustomerId"),
        employeeId: document.getElementById("bookingRoomDetailEmployeeId"),
        roomName: document.getElementById("bookingRoomDetailRoomName"),
        roomId: document.getElementById("bookingRoomDetailRoomId"),
        roomPrice: document.getElementById("bookingRoomDetailRoomPrice"),
        deposit: document.getElementById("bookingRoomDetailDeposit"),
        dateStart: document.getElementById("bookingRoomDetailDateStart"),
        dateEnd: document.getElementById("bookingRoomDetailDateEnd"),
        voucherCode: document.getElementById("bookingRoomDetailVoucherCode"),
        voucherId: document.getElementById("bookingRoomDetailVoucherId")
    };

    if (!window.apiClient
        || !keywordElement
        || !customerIdElement
        || !roomIdElement
        || !sortByElement
        || !sortDescElement
        || !itemsPerPageElement
        || !createButtonElement
        || !searchButtonElement
        || !resetButtonElement
        || !paginationElement
        || !summaryElement
        || !paginationInfoElement
        || !tableBodyElement
        || !detailModalElement
        || Object.values(detailFields).some(element => !element)) {
        return;
    }

    const state = {
        page: 1,
        itemsPerPage: Number(itemsPerPageElement.value) || 10,
        keyword: "",
        roomId: "",
        customerId: "",
        sortBy: sortByElement.value || "id",
        sortDesc: sortDescElement.value === "true",
        totalRows: 0
    };

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(date);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function formatOptionalCurrency(value) {
        return value === null || value === undefined || value === ""
            ? "-"
            : formatCurrency(value);
    }

    function getPagedResult(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response;
    }

    function renderRoomOptions(rooms) {
        const options = ['<option value="">Tất cả phòng</option>'];

        if (Array.isArray(rooms)) {
            rooms.forEach(room => {
                const roomId = room?.id ?? room?.Id ?? "";
                const roomName = room?.roomName ?? room?.RoomName ?? `Phòng ${roomId}`;

                if (roomId !== "") {
                    options.push(`<option value="${roomId}">${roomName}</option>`);
                }
            });
        }

        roomIdElement.innerHTML = options.join("");
        roomIdElement.value = state.roomId || "";
    }

    async function loadRoomOptions() {
        const token = apiClient.getToken();

        if (!token) {
            notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
            return;
        }

        roomIdElement.innerHTML = '<option value="">Đang tải phòng...</option>';

        try {
            const response = await apiClient.Get(`${roomApiUrl}?page=1&itemsPerPage=1000`);
            const result = getPagedResult(response);
            const rooms = result?.data ?? result?.Data ?? [];
            renderRoomOptions(rooms);
        } catch (error) {
            console.error("Load room options failed:", error);
            roomIdElement.innerHTML = '<option value="">Tất cả phòng</option>';
            notifier?.error(error?.message || "Không thể tải danh sách phòng.");
        }
    }

    function getResultObject(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response?.Data
            || response;
    }

    function formatValue(value) {
        return value === null || value === undefined || value === "" ? "-" : value;
    }

    function setDetailFieldValues(values) {
        detailFields.id.textContent = formatValue(values.id);
        detailFields.dateBooking.textContent = formatValue(values.dateBooking);
        detailFields.customerName.textContent = formatValue(values.customerName);
        detailFields.customerPhone.textContent = formatValue(values.customerPhone);
        detailFields.customerId.textContent = formatValue(values.customerId);
        detailFields.employeeId.textContent = formatValue(values.employeeId);
        detailFields.roomName.textContent = formatValue(values.roomName);
        detailFields.roomId.textContent = formatValue(values.roomId);
        detailFields.roomPrice.textContent = formatValue(values.roomPrice);
        detailFields.deposit.textContent = formatValue(values.deposit);
        detailFields.dateStart.textContent = formatValue(values.dateStart);
        detailFields.dateEnd.textContent = formatValue(values.dateEnd);
        detailFields.voucherCode.textContent = formatValue(values.voucherCode);
        detailFields.voucherId.textContent = formatValue(values.voucherId);
    }

    function setDetailLoadingState() {
        setDetailFieldValues({
            id: "Đang tải...",
            dateBooking: "Đang tải...",
            customerName: "Đang tải...",
            customerPhone: "Đang tải...",
            customerId: "Đang tải...",
            employeeId: "Đang tải...",
            roomName: "Đang tải...",
            roomId: "Đang tải...",
            roomPrice: "Đang tải...",
            deposit: "Đang tải...",
            dateStart: "Đang tải...",
            dateEnd: "Đang tải...",
            voucherCode: "Đang tải...",
            voucherId: "Đang tải..."
        });
    }

    function showDetailModal() {
        if (window.jQuery && typeof window.jQuery.fn.modal === "function") {
            window.jQuery(detailModalElement).modal("show");
            return;
        }

        detailModalElement.classList.add("show");
        detailModalElement.style.display = "block";
        detailModalElement.removeAttribute("aria-hidden");
        detailModalElement.setAttribute("aria-modal", "true");
    }

    async function loadBookingRoomDetail(id) {
        const token = apiClient.getToken();

        if (!token) {
            notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
            return;
        }

        setDetailLoadingState();
        showDetailModal();

        try {
            const response = await apiClient.Get(`${bookingRoomApiUrl}/${id}`);
            const detail = getResultObject(response);

            setDetailFieldValues({
                id: detail?.id ?? detail?.Id,
                dateBooking: formatDate(detail?.dateBooking ?? detail?.DateBooking),
                customerName: detail?.customerName ?? detail?.CustomerName,
                customerPhone: detail?.customerPhone ?? detail?.CustomerPhone,
                customerId: detail?.customerId ?? detail?.CustomerId,
                employeeId: detail?.employeeId ?? detail?.EmployeeId,
                roomName: detail?.roomName ?? detail?.RoomName,
                roomId: detail?.roomId ?? detail?.RoomId,
                roomPrice: formatOptionalCurrency(detail?.roomPrice ?? detail?.RoomPrice),
                deposit: formatOptionalCurrency(detail?.deposit ?? detail?.Deposit),
                dateStart: formatDate(detail?.dateStart ?? detail?.DateStart),
                dateEnd: formatDate(detail?.dateEnd ?? detail?.DateEnd),
                voucherCode: detail?.voucherCode ?? detail?.VoucherCode,
                voucherId: detail?.voucherId ?? detail?.VoucherId
            });
        } catch (error) {
            console.error("Load booking room detail failed:", error);
            setDetailFieldValues({
                id: "Lỗi tải dữ liệu",
                dateBooking: "-",
                customerName: "-",
                customerPhone: "-",
                customerId: "-",
                employeeId: "-",
                roomName: "-",
                roomId: "-",
                roomPrice: "-",
                deposit: "-",
                dateStart: "-",
                dateEnd: "-",
                voucherCode: "-",
                voucherId: "-"
            });
            notifier?.error(error?.message || "Không thể tải chi tiết đặt phòng.");
        }
    }

    function setLoadingState() {
        tableBodyElement.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        summaryElement.textContent = "Đang tải dữ liệu...";
        paginationInfoElement.textContent = "Đang tải dữ liệu...";
        paginationElement.innerHTML = "";
    }

    function renderEmptyState(message) {
        tableBodyElement.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">${message}</td>
            </tr>`;
    }

    function renderRows(bookings) {
        if (!Array.isArray(bookings) || bookings.length === 0) {
            renderEmptyState("Không có dữ liệu đặt phòng.");
            return;
        }

        tableBodyElement.innerHTML = bookings.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const customerId = item?.customerId ?? item?.customerId ?? "";
            const customerName = item?.customerName ?? item?.CustomerName ?? "-";
            const roomName = item?.roomName ?? item?.RoomName ?? "-";
            const dateBooking = item?.dateBooking ?? item?.DateBooking;
            const dateStart = item?.dateStart ?? item?.DateStart;
            const dateEnd = item?.dateEnd ?? item?.DateEnd;
            const deposit = item?.deposit ?? item?.Deposit ?? 0;

            return `
                <tr>
                    <td>${customerId}</td>
                    <td>${customerName}</td>
                    <td>${roomName}</td>
                    <td>${formatDate(dateBooking)}</td>
                    <td>${formatDate(dateStart)}</td>
                    <td>${formatDate(dateEnd)}</td>
                    <td>${formatCurrency(deposit)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-info btn-sm" data-action="detail" data-id="${id}" title="Chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>`;
        }).join("");
    }

    function createPaginationItem(label, page, disabled, active) {
        const disabledClass = disabled ? " disabled" : "";
        const activeClass = active ? " active" : "";

        return `
            <li class="page-item${disabledClass}${activeClass}">
                <button type="button" class="page-link" data-page="${page}" ${disabled ? "disabled" : ""}>${label}</button>
            </li>`;
    }

    function renderPaginationControls(totalPages) {
        if (totalPages <= 0) {
            paginationElement.innerHTML = "";
            return;
        }

        const currentPage = state.page;
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        const items = [
            createPaginationItem("Previous", currentPage - 1, currentPage <= 1, false)
        ];

        for (let page = startPage; page <= endPage; page += 1) {
            items.push(createPaginationItem(String(page), page, false, page === currentPage));
        }

        items.push(createPaginationItem("Next", currentPage + 1, currentPage >= totalPages, false));
        paginationElement.innerHTML = items.join("");
    }

    function updatePagination(totalRows) {
        state.totalRows = Number(totalRows) || 0;

        const pageSize = state.itemsPerPage;
        const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(state.totalRows / pageSize)) : 1;
        state.page = Math.min(Math.max(state.page, 1), totalPages);

        const currentPage = state.page;
        const startItem = state.totalRows === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
        const endItem = state.totalRows === 0 ? 0 : Math.min(currentPage * pageSize, state.totalRows);

        summaryElement.textContent = `Tổng ${state.totalRows} lượt đặt phòng`;
        paginationInfoElement.textContent = `Hiển thị ${startItem}-${endItem} trên ${state.totalRows} kết quả | Trang ${currentPage}/${totalPages}`;
        renderPaginationControls(totalPages);
    }

    function buildQueryString() {
        const params = new URLSearchParams({
            page: state.page.toString(),
            itemsPerPage: state.itemsPerPage.toString(),
            keyword: state.keyword,
            roomId: state.roomId,
            customerId: state.customerId,
            sortBy: state.sortBy,
            sortDesc: String(state.sortDesc)
        });

        return params.toString();
    }

    async function loadBookingRooms() {
        const token = apiClient.getToken();

        if (!token) {
            notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
            return;
        }

        setLoadingState();

        try {
            const response = await apiClient.Get(`${bookingRoomApiUrl}?${buildQueryString()}`);
            const result = getPagedResult(response);
            const bookings = result?.data ?? result?.Data ?? [];
            const totalRows = result?.totalRows ?? result?.TotalRows ?? bookings.length;
            const currentPage = result?.currentPage ?? result?.CurrentPage ?? state.page;

            state.page = Number(currentPage) || state.page;

            renderRows(bookings);
            updatePagination(totalRows);
        } catch (error) {
            console.error("Load booking rooms failed:", error);
            renderEmptyState("Không thể tải dữ liệu đặt phòng.");
            summaryElement.textContent = "Tải dữ liệu thất bại";
            paginationInfoElement.textContent = "Không thể tải dữ liệu.";
            paginationElement.innerHTML = "";
            notifier?.error(error?.message || "Không thể tải danh sách đặt phòng.");
        }
    }

    function syncStateFromFilters(resetPage) {
        state.keyword = keywordElement.value.trim();
        state.customerId = customerIdElement.value.trim();
        state.roomId = roomIdElement.value.trim();
        state.sortBy = sortByElement.value || "id";
        state.sortDesc = sortDescElement.value === "true";
        state.itemsPerPage = Number(itemsPerPageElement.value) || 10;

        if (resetPage) {
            state.page = 1;
        }
    }

    function resetFilters() {
        keywordElement.value = "";
        customerIdElement.value = "";
        roomIdElement.value = "";
        sortByElement.value = "id";
        sortDescElement.value = "false";
        itemsPerPageElement.value = "10";
        syncStateFromFilters(true);
        loadBookingRooms();
    }

    searchButtonElement.addEventListener("click", () => {
        syncStateFromFilters(true);
        loadBookingRooms();
    });

    createButtonElement.addEventListener("click", () => {
        window.location.href = "/BookingRoom/CreateBookingRoom"
    });

    resetButtonElement.addEventListener("click", resetFilters);

    itemsPerPageElement.addEventListener("change", () => {
        syncStateFromFilters(true);
        loadBookingRooms();
    });

    sortByElement.addEventListener("change", () => {
        syncStateFromFilters(true);
        loadBookingRooms();
    });

    sortDescElement.addEventListener("change", () => {
        syncStateFromFilters(true);
        loadBookingRooms();
    });

    keywordElement.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            syncStateFromFilters(true);
            loadBookingRooms();
        }
    });

    customerIdElement.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            syncStateFromFilters(true);
            loadBookingRooms();
        }
    });

    roomIdElement.addEventListener("change", () => {
        syncStateFromFilters(true);
        loadBookingRooms();
    });

    paginationElement.addEventListener("click", event => {
        const button = event.target.closest("[data-page]");
        if (!button) {
            return;
        }

        const targetPage = Number(button.dataset.page);
        const totalPages = state.itemsPerPage > 0 ? Math.max(1, Math.ceil(state.totalRows / state.itemsPerPage)) : 1;

        if (Number.isNaN(targetPage) || targetPage < 1 || targetPage > totalPages || targetPage === state.page) {
            return;
        }

        state.page = targetPage;
        loadBookingRooms();
    });

    tableBodyElement.addEventListener("click", event => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) {
            return;
        }

        const action = actionButton.dataset.action;
        const bookingId = actionButton.dataset.id;

        if (action === "detail") {
            loadBookingRoomDetail(bookingId);
        }
    });

    document.addEventListener("DOMContentLoaded", async () => {
        await loadRoomOptions();
        loadBookingRooms();
    });
})();
