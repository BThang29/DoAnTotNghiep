(() => {
    "use strict";

    const bookingRoomApiUrl = window.appUrl("/api/admin/booking-room");
    const bookingRoomPagedApiUrl = `${bookingRoomApiUrl}/available-rooms-paged`;
    const roomApiUrl = window.appUrl("/api/admin/room");
    const notifier = window.appNotifier;

    const dateStartElement = document.getElementById("checkAvailableRoomDateStart");
    const dateEndElement = document.getElementById("checkAvailableRoomDateEnd");
    const roomTypeElement = document.getElementById("checkAvailableRoomTypeId");
    const searchButtonElement = document.getElementById("checkAvailableRoomSearchButton");
    const statusTextElement = document.getElementById("checkAvailableRoomStatusText");
    const helpTextElement = document.getElementById("checkAvailableRoomHelpText");
    const resultBadgeElement = document.getElementById("checkAvailableRoomResultBadge");
    const listElement = document.getElementById("checkAvailableRoomList");
    const paginationWrapperElement = document.getElementById("checkAvailableRoomPaginationWrapper");
    const paginationElement = document.getElementById("checkAvailableRoomPagination");
    const summaryDateElement = document.getElementById("checkAvailableRoomSummaryDate");
    const summaryTypeElement = document.getElementById("checkAvailableRoomSummaryType");
    const summaryCountElement = document.getElementById("checkAvailableRoomSummaryCount");

    if (!window.apiClient
        || !dateStartElement
        || !dateEndElement
        || !roomTypeElement
        || !searchButtonElement
        || !statusTextElement
        || !helpTextElement
        || !resultBadgeElement
        || !listElement
        || !paginationWrapperElement
        || !paginationElement
        || !summaryDateElement
        || !summaryTypeElement
        || !summaryCountElement) {
        return;
    }

    const state = {
        roomTypes: [],
        rooms: [],
        page: 1,
        itemsPerPage: 4,
        totalRows: 0,
        totalPages: 1,
        lastValidationKey: ""
    };

    function ensureAuthenticated() {
        const token = apiClient.getToken();
        if (!token) {
            notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
            return false;
        }

        return true;
    }

    function formatCurrency(value) {
        if (value === null || value === undefined || value === "") {
            return "Chưa cập nhật";
        }

        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function formatDateDisplay(value) {
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

    function parseDateOnly(value) {
        const trimmedValue = String(value || "").trim();
        if (!trimmedValue) {
            return null;
        }

        const match = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            return null;
        }

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const parsedDate = new Date(year, month - 1, day);

        if (Number.isNaN(parsedDate.getTime())
            || parsedDate.getFullYear() !== year
            || parsedDate.getMonth() !== month - 1
            || parsedDate.getDate() !== day) {
            return null;
        }

        parsedDate.setHours(0, 0, 0, 0);
        return parsedDate;
    }

    function getResultObject(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response?.Data
            || response;
    }

    function setLoadingState(isLoading) {
        searchButtonElement.disabled = isLoading;
        searchButtonElement.classList.toggle("disabled", isLoading);
        searchButtonElement.innerHTML = isLoading
            ? '<i class="fas fa-spinner fa-spin fa-sm"></i> Đang tải'
            : '<i class="fas fa-search fa-sm"></i> Kiểm tra';
    }

    function renderRoomTypes(roomTypes) {
        const options = ['<option value="">Tất cả loại phòng</option>'];

        roomTypes.forEach(roomType => {
            const id = roomType?.id ?? roomType?.Id ?? "";
            const name = roomType?.name ?? roomType?.Name ?? id;
            options.push(`<option value="${id}">${name}</option>`);
        });

        roomTypeElement.innerHTML = options.join("");
    }

    function renderEmptyState(title, description) {
        paginationWrapperElement.hidden = true;
        paginationElement.innerHTML = "";
        listElement.innerHTML = `
            <div class="col-12">
                <div class="check-room-empty-state">
                    <div class="check-room-empty-icon">
                        <i class="fas fa-bed"></i>
                    </div>
                    <div class="font-weight-bold text-gray-800 mb-2">${title}</div>
                    <div class="text-muted small">${description}</div>
                </div>
            </div>`;
    }

    function renderRooms(rooms) {
        if (!Array.isArray(rooms) || rooms.length === 0) {
            renderEmptyState("Không có phòng trống", "Không tìm thấy phòng phù hợp trong khoảng thời gian đã chọn.");
            return;
        }

        listElement.innerHTML = rooms.map(room => {
            const roomId = room?.roomId ?? room?.RoomId ?? "";
            const roomName = room?.roomName ?? room?.RoomName ?? `Phòng ${roomId}`;
            const roomTypeName = room?.roomTypeName ?? room?.RoomTypeName ?? "Chưa phân loại";
            const roomTypeId = room?.roomTypeId ?? room?.RoomTypeId ?? "-";
            const price = room?.price ?? room?.Price;
            const roomCode = String(roomName).replace(/\s+/g, "").toUpperCase();

            return `
                <div class="col-12 mb-3">
                    <div class="check-room-item">
                        <div class="check-room-item-header">
                            <div class="check-room-item-title-wrap">
                                <div class="check-room-item-name">${roomName}</div>
                                <div class="check-room-item-code">Ký hiệu ${roomCode}</div>
                            </div>
                            <div class="check-room-price-wrap">
                                <div class="check-room-price-label">Giá mỗi đêm</div>
                                <div class="check-room-price">${formatCurrency(price)}</div>
                            </div>
                        </div>

                        <div class="check-room-description">${roomTypeName}</div>

                        <div class="check-room-tags">
                            <span class="check-room-tag">
                                <i class="fas fa-door-open"></i>
                                Phòng trống
                            </span>
                            <span class="check-room-tag check-room-tag-soft">
                                <i class="fas fa-layer-group"></i>
                                ${roomTypeId}
                            </span>
                        </div>

                        <div class="check-room-meta-grid">
                            <div class="check-room-meta-card">
                                <div class="check-room-meta-label">Mã phòng</div>
                                <div class="check-room-meta-value">#${roomId}</div>
                            </div>
                            <div class="check-room-meta-card">
                                <div class="check-room-meta-label">Loại</div>
                                <div class="check-room-meta-value">${roomTypeId}</div>
                            </div>
                        </div>

                        <div class="check-room-item-footer">
                            <a href="/BookingRoom/CreateBookingRoom" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-calendar-plus fa-sm mr-1"></i> Đặt phòng này
                            </a>
                        </div>
                    </div>
                </div>`;
        }).join("");
    }

    function createPaginationItem(label, page, disabled, active) {
        return `
            <li class="page-item${disabled ? " disabled" : ""}${active ? " active" : ""}">
                <a class="page-link" href="#" data-page="${page}">${label}</a>
            </li>`;
    }

    function renderPagination() {
        if (state.totalPages <= 1) {
            paginationWrapperElement.hidden = true;
            paginationElement.innerHTML = "";
            return;
        }

        const items = [
            createPaginationItem("&laquo;", state.page - 1, state.page <= 1, false)
        ];

        for (let page = 1; page <= state.totalPages; page += 1) {
            items.push(createPaginationItem(String(page), page, false, page === state.page));
        }

        items.push(createPaginationItem("&raquo;", state.page + 1, state.page >= state.totalPages, false));

        paginationElement.innerHTML = items.join("");
        paginationWrapperElement.hidden = false;
    }

    function updateSummary() {
        const selectedRoomTypeText = roomTypeElement.options[roomTypeElement.selectedIndex]?.text || "Tất cả";
        const dateStart = dateStartElement.value;
        const dateEnd = dateEndElement.value;

        summaryTypeElement.textContent = selectedRoomTypeText;
        summaryCountElement.textContent = String(state.totalRows);
        summaryDateElement.textContent = dateStart && dateEnd
            ? `${formatDateDisplay(dateStart)} - ${formatDateDisplay(dateEnd)}`
            : "-";

        resultBadgeElement.textContent = `${state.totalRows} phòng`;
    }

    function validateFilters() {
        if (!dateStartElement.value || !dateEndElement.value) {
            notifier?.warning("Vui lòng chọn ngày nhận và ngày trả phòng.");
            return false;
        }

        const start = parseDateOnly(dateStartElement.value);
        const end = parseDateOnly(dateEndElement.value);

        if (!start || !end) {
            notifier?.warning("Thời gian kiểm tra phòng không hợp lệ.");
            return false;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (start < now && end < now) {
            notifier?.warning("Ngày nhận phòng và ngày trả phòng không được nhỏ hơn ngày hiện tại.");
            return false;
        }

        if (end < start) {
            notifier?.warning("Ngày trả phòng phải lớn hơn hoặc bằng ngày nhận phòng.");
            return false;
        }

        return true;
    }

    function validateDateInputs(showNotification = true) {
        if (!dateStartElement.value || !dateEndElement.value) {
            state.lastValidationKey = "";
            return true;
        }

        const start = parseDateOnly(dateStartElement.value);
        const end = parseDateOnly(dateEndElement.value);
        if (!start || !end) {
            state.lastValidationKey = "";
            return false;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (start < now && end < now) {
            const validationKey = `${dateStartElement.value}|${dateEndElement.value}|past`;
            if (showNotification && state.lastValidationKey !== validationKey) {
                notifier?.warning("Ngày nhận phòng và ngày trả phòng không được nhỏ hơn ngày hiện tại.");
            }
            state.lastValidationKey = validationKey;
            return false;
        }

        state.lastValidationKey = "";
        return true;
    }

    async function loadRoomTypes() {
        const response = await apiClient.Get(`${roomApiUrl}/types`);
        const result = getResultObject(response);
        state.roomTypes = Array.isArray(result) ? result : [];
        renderRoomTypes(state.roomTypes);
    }

    async function loadAvailableRooms() {
        if (!validateFilters()) {
            return;
        }

        setLoadingState(true);
        statusTextElement.textContent = "Đang kiểm tra danh sách phòng trống...";
        helpTextElement.textContent = "Hệ thống đang gọi API tra cứu phòng còn trống.";

        try {
            const query = new URLSearchParams({
                dateStart: dateStartElement.value,
                dateEnd: dateEndElement.value,
                page: String(state.page),
                itemsPerPage: String(state.itemsPerPage)
            });

            if (roomTypeElement.value) {
                query.set("roomTypeId", roomTypeElement.value);
            }

            const response = await apiClient.Get(`${bookingRoomPagedApiUrl}?${query.toString()}`);
            const result = getResultObject(response) || {};
            state.rooms = Array.isArray(result?.data) ? result.data : Array.isArray(result?.Data) ? result.Data : [];
            state.totalRows = Number(result?.totalRows ?? result?.TotalRows ?? 0) || 0;
            state.page = Number(result?.currentPage ?? result?.CurrentPage ?? state.page) || 1;
            state.itemsPerPage = 4;
            state.totalPages = state.itemsPerPage > 0
                ? Math.max(1, Math.ceil(state.totalRows / state.itemsPerPage))
                : 1;

            renderRooms(state.rooms);
            renderPagination();
            updateSummary();

            helpTextElement.textContent = state.totalRows > 0
                ? `Tìm thấy ${state.totalRows} phòng trống phù hợp.`
                : "Không có phòng trống trong khoảng thời gian đã chọn.";
            statusTextElement.textContent = "Kiểm tra phòng trống thành công.";
        } catch (error) {
            console.error("Load available rooms failed:", error);
            state.rooms = [];
            state.totalRows = 0;
            state.totalPages = 1;
            renderEmptyState("Không thể tải dữ liệu", "Đã có lỗi khi gọi API kiểm tra phòng trống.");
            updateSummary();
            helpTextElement.textContent = "Không thể kiểm tra phòng trống.";
            statusTextElement.textContent = "Tra cứu thất bại.";
            notifier?.error(error?.message || "Không thể tải danh sách phòng trống.");
        } finally {
            setLoadingState(false);
        }
    }

    function bindEvents() {
        searchButtonElement.addEventListener("click", () => {
            state.page = 1;
            loadAvailableRooms();
        });

        paginationElement.addEventListener("click", event => {
            const link = event.target.closest("[data-page]");
            if (!link) {
                return;
            }

            event.preventDefault();
            const nextPage = Number(link.dataset.page);
            if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > state.totalPages || nextPage === state.page) {
                return;
            }

            state.page = nextPage;
            loadAvailableRooms();
        });

        [dateStartElement, dateEndElement, roomTypeElement].forEach(element => {
            element.addEventListener("change", () => {
                state.page = 1;
                if (element === dateStartElement || element === dateEndElement) {
                    validateDateInputs();
                }
                updateSummary();
            });
            element.addEventListener("input", () => {
                if (element === dateStartElement || element === dateEndElement) {
                    validateDateInputs(false);
                }
                updateSummary();
            });
        });

        [dateStartElement, dateEndElement].forEach(element => {
            element.addEventListener("blur", () => {
                validateDateInputs();
                updateSummary();
            });
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        if (!ensureAuthenticated()) {
            return;
        }

        dateStartElement.value = "";
        dateEndElement.value = "";

        try {
            await loadRoomTypes();
            renderEmptyState("Sẵn sàng tra cứu", "Chọn khoảng thời gian và nhấn kiểm tra để tải phòng trống.");
            statusTextElement.textContent = "Đã tải danh sách loại phòng.";
        } catch (error) {
            console.error("Load room types failed:", error);
            notifier?.error(error?.message || "Không thể tải danh sách loại phòng.");
            statusTextElement.textContent = "Không thể tải dữ liệu ban đầu.";
        }

        bindEvents();
        updateSummary();
    });
})();
