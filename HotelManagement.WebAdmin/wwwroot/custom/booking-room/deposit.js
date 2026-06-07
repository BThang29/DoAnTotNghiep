
(() => {
    "use strict";

    const bookingRoomApiUrl = window.appUrl("/api/admin/booking-room");
    const notifier = window.appNotifier;

    const keywordElement = document.getElementById("depositKeyword");
    const customerIdElement = document.getElementById("depositCustomerId");
    const itemsPerPageElement = document.getElementById("depositItemsPerPage");
    const searchButtonElement = document.getElementById("depositSearchButton");
    const summaryElement = document.getElementById("depositSummary");
    const paginationInfoElement = document.getElementById("depositPaginationInfo");
    const tableBodyElement = document.getElementById("depositTableBody");
    const paginationElement = document.getElementById("depositPagination");

    const selectedBookingTitleElement = document.getElementById("depositSelectedBookingTitle");
    const selectedBookingMetaElement = document.getElementById("depositSelectedBookingMeta");
    const bookingIdElement = document.getElementById("depositBookingId");
    const amountElement = document.getElementById("depositAmount");
    const amountPreviewElement = document.getElementById("depositAmountPreview");
    const statusTextElement = document.getElementById("depositStatusText");
    const submitButtonElement = document.getElementById("depositSubmitButton");

    const detailFields = {
        id: document.getElementById("depositDetailId"),
        customerName: document.getElementById("depositDetailCustomerName"),
        customerPhone: document.getElementById("depositDetailCustomerPhone"),
        roomName: document.getElementById("depositDetailRoomName"),
        dateStart: document.getElementById("depositDetailDateStart"),
        dateEnd: document.getElementById("depositDetailDateEnd"),
        roomPrice: document.getElementById("depositDetailRoomPrice"),
        currentDeposit: document.getElementById("depositDetailCurrentDeposit")
    };

    if (!window.apiClient
        || !keywordElement
        || !customerIdElement
        || !itemsPerPageElement
        || !searchButtonElement
        || !summaryElement
        || !paginationInfoElement
        || !tableBodyElement
        || !paginationElement
        || !selectedBookingTitleElement
        || !selectedBookingMetaElement
        || !bookingIdElement
        || !amountElement
        || !amountPreviewElement
        || !statusTextElement
        || !submitButtonElement
        || Object.values(detailFields).some(element => !element)) {
        return;
    }

    const state = {
        page: 1,
        itemsPerPage: Number(itemsPerPageElement.value) || 10,
        keyword: "",
        customerId: "",
        totalRows: 0,
        selectedBookingId: null,
        bookings: []
    };

    function ensureAuthenticated() {
        const token = apiClient.getToken();
        if (!token) {
            notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
            return false;
        }

        return true;
    }

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

    function getResultObject(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response?.Data
            || response;
    }

    function setDetailValues(values) {
        detailFields.id.textContent = values.id ?? "-";
        detailFields.customerName.textContent = values.customerName ?? "-";
        detailFields.customerPhone.textContent = values.customerPhone ?? "-";
        detailFields.roomName.textContent = values.roomName ?? "-";
        detailFields.dateStart.textContent = values.dateStart ?? "-";
        detailFields.dateEnd.textContent = values.dateEnd ?? "-";
        detailFields.roomPrice.textContent = values.roomPrice ?? "-";
        detailFields.currentDeposit.textContent = values.currentDeposit ?? "-";
    }

    function resetDetailPanel() {
        state.selectedBookingId = null;
        bookingIdElement.value = "";
        amountElement.value = "";
        selectedBookingTitleElement.textContent = "Chưa chọn booking";
        selectedBookingMetaElement.textContent = "Chọn một booking từ danh sách bên trái để xem và sửa tiền cọc.";
        amountPreviewElement.textContent = "Giá trị nhập: -";
        statusTextElement.textContent = "Chọn booking để bắt đầu cập nhật tiền cọc.";
        setDetailValues({
            id: "-",
            customerName: "-",
            customerPhone: "-",
            roomName: "-",
            dateStart: "-",
            dateEnd: "-",
            roomPrice: "-",
            currentDeposit: "-"
        });
    }

    function setDetailLoadingState() {
        selectedBookingTitleElement.textContent = "Đang tải booking...";
        selectedBookingMetaElement.textContent = "Hệ thống đang lấy chi tiết booking.";
        statusTextElement.textContent = "Đang tải chi tiết booking...";
        setDetailValues({
            id: "Đang tải...",
            customerName: "Đang tải...",
            customerPhone: "Đang tải...",
            roomName: "Đang tải...",
            dateStart: "Đang tải...",
            dateEnd: "Đang tải...",
            roomPrice: "Đang tải...",
            currentDeposit: "Đang tải..."
        });
    }

    function buildQueryString() {
        const params = new URLSearchParams({
            page: state.page.toString(),
            itemsPerPage: state.itemsPerPage.toString(),
            keyword: state.keyword,
            customerId: state.customerId,
            sortBy: "id",
            sortDesc: "true"
        });

        return params.toString();
    }

    function setTableLoadingState() {
        tableBodyElement.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Đang tải dữ liệu booking...</td>
            </tr>`;
        summaryElement.textContent = "Đang tải dữ liệu...";
        paginationInfoElement.textContent = "";
        paginationElement.innerHTML = "";
    }

    function renderEmptyState(message) {
        tableBodyElement.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">${message}</td>
            </tr>`;
    }

    function createPaginationItem(label, page, disabled, active) {
        return `
            <li class="page-item${disabled ? " disabled" : ""}${active ? " active" : ""}">
                <button type="button" class="page-link" data-page="${page}" ${disabled ? "disabled" : ""}>${label}</button>
            </li>`;
    }

    function renderPaginationControls(totalPages) {
        if (totalPages <= 0) {
            paginationElement.innerHTML = "";
            return;
        }

        const currentPage = state.page;
        const items = [createPaginationItem("Previous", currentPage - 1, currentPage <= 1, false)];

        for (let page = 1; page <= totalPages; page += 1) {
            if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                items.push(createPaginationItem(String(page), page, false, page === currentPage));
            }
        }

        items.push(createPaginationItem("Next", currentPage + 1, currentPage >= totalPages, false));
        paginationElement.innerHTML = items.join("");
    }

    function updatePagination(totalRows) {
        state.totalRows = Number(totalRows) || 0;
        const totalPages = Math.max(1, Math.ceil(state.totalRows / state.itemsPerPage));
        const startItem = state.totalRows === 0 ? 0 : ((state.page - 1) * state.itemsPerPage) + 1;
        const endItem = state.totalRows === 0 ? 0 : Math.min(state.page * state.itemsPerPage, state.totalRows);

        summaryElement.textContent = `Tổng ${state.totalRows} booking`;
        paginationInfoElement.textContent = `Hiển thị ${startItem}-${endItem} trên ${state.totalRows}`;
        renderPaginationControls(totalPages);
    }

    function renderRows(bookings) {
        if (!Array.isArray(bookings) || bookings.length === 0) {
            renderEmptyState("Không có booking phù hợp.");
            return;
        }

        tableBodyElement.innerHTML = bookings.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const customerName = item?.customerName ?? item?.CustomerName ?? "-";
            const roomName = item?.roomName ?? item?.RoomName ?? "-";
            const dateStart = item?.dateStart ?? item?.DateStart;
            const dateEnd = item?.dateEnd ?? item?.DateEnd;
            const deposit = item?.deposit ?? item?.Deposit;
            const isSelected = Number(id) === Number(state.selectedBookingId);

            return `
                <tr class="${isSelected ? "table-primary" : ""}">
                    <td>
                        <div class="deposit-booking-title">#${id}</div>
                        <div class="deposit-booking-meta">${formatDate(item?.dateBooking ?? item?.DateBooking)}</div>
                    </td>
                    <td>${customerName}</td>
                    <td>${roomName}</td>
                    <td>${formatDate(dateStart)} - ${formatDate(dateEnd)}</td>
                    <td class="text-right deposit-value-strong">${formatOptionalCurrency(deposit)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-primary btn-sm" data-action="select" data-id="${id}">
                            Chọn
                        </button>
                    </td>
                </tr>`;
        }).join("");
    }

    async function loadBookings() {
        if (!ensureAuthenticated()) {
            return;
        }

        setTableLoadingState();

        try {
            const response = await apiClient.Get(`${bookingRoomApiUrl}?${buildQueryString()}`);
            const result = getPagedResult(response);
            const bookings = result?.data ?? result?.Data ?? [];
            const totalRows = result?.totalRows ?? result?.TotalRows ?? bookings.length;
            const currentPage = result?.currentPage ?? result?.CurrentPage ?? state.page;

            state.bookings = bookings;
            state.page = Number(currentPage) || state.page;

            renderRows(bookings);
            updatePagination(totalRows);
        } catch (error) {
            console.error("Load bookings failed:", error);
            renderEmptyState("Không thể tải danh sách booking.");
            summaryElement.textContent = "Tải dữ liệu thất bại";
            paginationInfoElement.textContent = "";
            paginationElement.innerHTML = "";
            notifier?.error(error?.message || "Không thể tải danh sách booking.");
        }
    }

    async function loadBookingDetail(id) {
        if (!ensureAuthenticated()) {
            return;
        }

        state.selectedBookingId = Number(id);
        bookingIdElement.value = String(id);
        amountElement.value = "";
        amountPreviewElement.textContent = "Giá trị nhập: -";
        setDetailLoadingState();
        renderRows(state.bookings);

        try {
            const response = await apiClient.Get(`${bookingRoomApiUrl}/${id}`);
            const detail = getResultObject(response);

            selectedBookingTitleElement.textContent = `Booking #${detail?.id ?? detail?.Id}`;
            selectedBookingMetaElement.textContent = `${detail?.customerName ?? detail?.CustomerName ?? "-"} | ${detail?.roomName ?? detail?.RoomName ?? "-"}`;
            statusTextElement.textContent = "Bạn có thể nhập tiền cọc mới và lưu cập nhật.";

            setDetailValues({
                id: detail?.id ?? detail?.Id ?? "-",
                customerName: detail?.customerName ?? detail?.CustomerName ?? "-",
                customerPhone: detail?.customerPhone ?? detail?.CustomerPhone ?? "-",
                roomName: detail?.roomName ?? detail?.RoomName ?? "-",
                dateStart: formatDate(detail?.dateStart ?? detail?.DateStart),
                dateEnd: formatDate(detail?.dateEnd ?? detail?.DateEnd),
                roomPrice: formatOptionalCurrency(detail?.roomPrice ?? detail?.RoomPrice),
                currentDeposit: formatOptionalCurrency(detail?.deposit ?? detail?.Deposit)
            });
        } catch (error) {
            console.error("Load booking detail failed:", error);
            resetDetailPanel();
            notifier?.error(error?.message || "Không thể tải chi tiết booking.");
        }
    }

    async function updateDeposit() {
        if (!ensureAuthenticated()) {
            return;
        }

        const bookingId = Number(bookingIdElement.value);
        const depositValue = amountElement.value.trim();

        if (!bookingId) {
            notifier?.warning("Vui lòng chọn booking cần cập nhật.");
            return;
        }

        if (depositValue === "") {
            notifier?.warning("Vui lòng nhập tiền cọc mới.");
            amountElement.focus();
            return;
        }

        const deposit = Number(depositValue);
        if (Number.isNaN(deposit) || deposit < 0) {
            notifier?.warning("Tiền cọc không hợp lệ.");
            amountElement.focus();
            return;
        }

        submitButtonElement.disabled = true;
        statusTextElement.textContent = "Đang cập nhật tiền cọc...";

        try {
            const response = await apiClient.Put(`${bookingRoomApiUrl}/${bookingId}/deposit`, {
                deposit: deposit
            });
            const statusCode = response?.statusCode ?? response?.StatusCode ?? 0;
            const message = response?.message ?? response?.Message ?? "Cập nhật tiền cọc thành công.";

            if (statusCode && statusCode >= 400) {
                throw new Error(message);
            }

            notifier?.success(message);
            statusTextElement.textContent = "Cập nhật tiền cọc thành công.";
            await loadBookingDetail(bookingId);
            await loadBookings();
        } catch (error) {
            console.error("Update deposit failed:", error);
            statusTextElement.textContent = "Cập nhật tiền cọc thất bại.";
            notifier?.error(error?.message || "Không thể cập nhật tiền cọc.");
        } finally {
            submitButtonElement.disabled = false;
        }
    }

    function syncStateFromFilters(resetPage) {
        state.keyword = keywordElement.value.trim();
        state.customerId = customerIdElement.value.trim();
        state.itemsPerPage = Number(itemsPerPageElement.value) || 10;

        if (resetPage) {
            state.page = 1;
        }
    }

    function bindEvents() {
        searchButtonElement.addEventListener("click", () => {
            syncStateFromFilters(true);
            loadBookings();
        });

        itemsPerPageElement.addEventListener("change", () => {
            syncStateFromFilters(true);
            loadBookings();
        });

        keywordElement.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                syncStateFromFilters(true);
                loadBookings();
            }
        });

        customerIdElement.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                syncStateFromFilters(true);
                loadBookings();
            }
        });

        tableBodyElement.addEventListener("click", event => {
            const button = event.target.closest("[data-action='select']");
            if (!button) {
                return;
            }

            loadBookingDetail(button.dataset.id);
        });

        paginationElement.addEventListener("click", event => {
            const button = event.target.closest("[data-page]");
            if (!button) {
                return;
            }

            const targetPage = Number(button.dataset.page);
            const totalPages = Math.max(1, Math.ceil(state.totalRows / state.itemsPerPage));

            if (Number.isNaN(targetPage) || targetPage < 1 || targetPage > totalPages || targetPage === state.page) {
                return;
            }

            state.page = targetPage;
            loadBookings();
        });

        amountElement.addEventListener("input", () => {
            const rawValue = amountElement.value.trim();
            amountPreviewElement.textContent = rawValue === ""
                ? "Giá trị nhập: -"
                : `Giá trị nhập: ${formatCurrency(rawValue)}`;
        });

        submitButtonElement.addEventListener("click", updateDeposit);
    }

    document.addEventListener("DOMContentLoaded", async () => {
        if (!ensureAuthenticated()) {
            return;
        }

        resetDetailPanel();
        bindEvents();
        await loadBookings();
    });
})();
