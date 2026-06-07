(function () {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const stateBox = document.getElementById("availableRoomsState");
    const contentBox = document.getElementById("availableRoomsContent");
    const dateRangeElement = document.getElementById("availableRoomsDateRange");
    const roomTypeElement = document.getElementById("availableRoomsType");
    const countElement = document.getElementById("availableRoomsCount");
    const messageElement = document.getElementById("availableRoomsMessage");
    const gridElement = document.getElementById("availableRoomsGrid");
    const paginationElement = document.getElementById("availableRoomsPagination");
    const sortElement = document.getElementById("availableRoomsSort");
    const notifier = window.appNotifier;
    const state = {
        page: 1,
        itemsPerPage: 6,
        totalRows: 0,
        dateStart: "",
        dateEnd: "",
        roomTypeId: "",
        sort: "price-asc"
    };

    if (!stateBox || !contentBox || !dateRangeElement || !roomTypeElement || !countElement || !messageElement || !gridElement || !paginationElement || !sortElement) {
        return;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function parseQueryDate(value) {
        const normalizedValue = String(value || "").trim();
        if (!normalizedValue) {
            return null;
        }

        const parsedDate = new Date(normalizedValue);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    function formatDisplayDate(date) {
        return date.toLocaleDateString("vi-VN");
    }

    function formatPrice(value) {
        return value === null || value === undefined
            ? "Liên hệ"
            : `${Number(value).toLocaleString("vi-VN")} VND`;
    }

    function getSortRequest(sortValue) {
        return sortValue === "price-desc"
            ? { sortBy: "Price", sortDesc: true }
            : { sortBy: "Price", sortDesc: false };
    }

    function syncQueryString() {
        const query = new URLSearchParams();

        if (state.dateStart) {
            query.set("dateStart", state.dateStart);
        }

        if (state.dateEnd) {
            query.set("dateEnd", state.dateEnd);
        }

        if (state.roomTypeId) {
            query.set("roomTypeId", state.roomTypeId);
        }

        query.set("page", String(state.page));
        query.set("itemsPerPage", String(state.itemsPerPage));
        query.set("sort", state.sort);

        const nextUrl = `${window.location.pathname}?${query.toString()}`;
        window.history.replaceState({}, "", nextUrl);
    }

    function setState(message, isError) {
        stateBox.hidden = false;
        contentBox.hidden = true;
        paginationElement.hidden = true;
        paginationElement.innerHTML = "";
        stateBox.className = `available-rooms-state ${isError ? "is-error" : "is-empty"}`;
        stateBox.innerHTML = `
            <i class="fa ${isError ? "fa-exclamation-circle" : "fa-bed"}"></i>
            <span>${escapeHtml(message)}</span>`;
    }

    function parsePositiveInteger(value, fallbackValue) {
        const parsedValue = Number.parseInt(String(value || ""), 10);
        return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
    }

    function createPaginationItem(label, page, disabled, active) {
        const disabledClass = disabled ? " is-disabled" : "";
        const activeClass = active ? " is-active" : "";

        return `
            <button type="button" class="available-pagination__button${disabledClass}${activeClass}" data-page="${page}" ${disabled ? "disabled" : ""}>
                ${escapeHtml(label)}
            </button>`;
    }

    function renderPagination(totalRows) {
        state.totalRows = Number(totalRows) || 0;

        const totalPages = state.itemsPerPage > 0
            ? Math.max(1, Math.ceil(state.totalRows / state.itemsPerPage))
            : 1;
        state.page = Math.min(Math.max(1, state.page), totalPages);

        if (totalPages <= 1) {
            paginationElement.hidden = true;
            paginationElement.innerHTML = "";
            return;
        }

        const maxVisiblePages = 5;
        let startPage = Math.max(1, state.page - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        const items = [
            createPaginationItem("Prev", state.page - 1, state.page <= 1, false)
        ];

        for (let page = startPage; page <= endPage; page += 1) {
            items.push(createPaginationItem(String(page), page, false, page === state.page));
        }

        items.push(createPaginationItem("Next", state.page + 1, state.page >= totalPages, false));
        paginationElement.innerHTML = items.join("");

        paginationElement.hidden = false;
    }

    function renderRooms(rooms, totalRows, currentPage, pageSize, message) {
        const normalizedRooms = Array.isArray(rooms) ? rooms : [];
        state.page = currentPage;
        state.itemsPerPage = pageSize;
        countElement.textContent = String(totalRows);
        messageElement.textContent = message;

        if (normalizedRooms.length === 0) {
            setState(message, false);
            return;
        }

        gridElement.innerHTML = normalizedRooms.map(room => {
            const roomId = room?.roomId ?? room?.RoomId ?? "";
            const roomName = room?.roomName ?? room?.RoomName ?? "";
            const roomTypeId = room?.roomTypeId ?? room?.RoomTypeId ?? "";
            const roomTypeName = room?.roomTypeName ?? room?.RoomTypeName ?? "";
            const price = room?.price ?? room?.Price ?? null;
            const bookingQuery = new URLSearchParams({
                roomId: String(roomId || ""),
                roomName: String(roomName || ""),
                roomTypeId: String(roomTypeId || ""),
                price: String(price ?? ""),
                dateStart: state.dateStart,
                dateEnd: state.dateEnd
            });

            return `
                <article class="room-result-card">
                    <div class="room-result-card__top">
                        <div>
                            <div class="room-result-card__type">${escapeHtml(roomTypeId || "ROOM")}</div>
                            <h3>${escapeHtml(roomName)}</h3>
                            <p>${escapeHtml(roomTypeName || "Phòng sẵn sàng để đặt ngay.")}</p>
                        </div>
                        <div class="room-result-card__price">
                            <strong>${escapeHtml(formatPrice(price))}</strong>
                            <span>Mỗi đêm</span>
                        </div>
                    </div>
                    <div class="room-result-card__footer">
                        <div class="room-result-card__meta">
                            <span>Mã phòng</span>
                            <strong>#${escapeHtml(roomId)}</strong>
                        </div>
                        <a class="room-result-card__action" href="/BookingRoom/CreateBooking?${bookingQuery.toString()}">
                            Đặt phòng ngay
                        </a>
                    </div>
                </article>`;
        }).join("");

        stateBox.hidden = true;
        contentBox.hidden = false;
        renderPagination(totalRows);
    }

    async function loadRoomTypesMap() {
        const response = await fetch(`${apiBaseUrl}/api/client/room/types`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || data?.Message || "Không thể tải danh sách loại phòng.");
        }

        const result = Array.isArray(data?.resultObj) ? data.resultObj : Array.isArray(data?.ResultObj) ? data.ResultObj : [];
        return result.reduce((accumulator, item) => {
            const id = item?.id ?? item?.Id ?? "";
            const name = item?.name ?? item?.Name ?? "";
            if (id) {
                accumulator[String(id)] = String(name || id);
            }

            return accumulator;
        }, {});
    }

    async function loadAvailableRooms() {
        const dateStart = parseQueryDate(state.dateStart);
        const dateEnd = parseQueryDate(state.dateEnd);
        const roomTypeId = state.roomTypeId;
        const currentPage = state.page;
        const itemsPerPage = state.itemsPerPage;

        if (!dateStart || !dateEnd) {
            dateRangeElement.textContent = "Chưa chọn ngày";
            roomTypeElement.textContent = roomTypeId || "Tất cả loại phòng";
            const message = "Vui lòng chọn ngày nhận phòng và ngày trả phòng.";
            notifier?.warning(message);
            setState(message, true);
            return;
        }

        if (dateEnd < dateStart) {
            dateRangeElement.textContent = `${formatDisplayDate(dateStart)} - ${formatDisplayDate(dateEnd)}`;
            roomTypeElement.textContent = roomTypeId || "Tất cả loại phòng";
            const message = "Ngày trả phòng phải lớn hơn hoặc bằng ngày nhận phòng.";
            notifier?.warning(message);
            setState(message, true);
            return;
        }

        dateRangeElement.textContent = `${formatDisplayDate(dateStart)} - ${formatDisplayDate(dateEnd)}`;

        try {
            const roomTypesMap = await loadRoomTypesMap();
            roomTypeElement.textContent = roomTypeId ? (roomTypesMap[roomTypeId] || roomTypeId) : "Tất cả loại phòng";

            const apiQuery = new URLSearchParams({
                DateStart: state.dateStart,
                DateEnd: state.dateEnd,
                Page: String(currentPage),
                ItemsPerPage: String(itemsPerPage)
            });
            const sortRequest = getSortRequest(state.sort);
            apiQuery.set("SortBy", sortRequest.sortBy);
            apiQuery.set("SortDesc", String(sortRequest.sortDesc));

            if (roomTypeId) {
                apiQuery.set("RoomTypeId", roomTypeId);
            }

            const response = await fetch(`${apiBaseUrl}/api/client/room/available-rooms?${apiQuery.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || "Không thể kiểm tra phòng trống.");
            }

            const pageResult = data?.resultObj ?? data?.ResultObj ?? {};
            const rooms = Array.isArray(pageResult?.data) ? pageResult.data : Array.isArray(pageResult?.Data) ? pageResult.Data : [];
            const totalRows = parsePositiveInteger(pageResult?.totalRows ?? pageResult?.TotalRows, 0);
            const resolvedCurrentPage = parsePositiveInteger(pageResult?.currentPage ?? pageResult?.CurrentPage, currentPage);
            const resolvedPageSize = parsePositiveInteger(pageResult?.pageSize ?? pageResult?.PageSize, itemsPerPage);
            const message = totalRows > 0
                ? `Tìm thấy ${totalRows} phòng trống.`
                : "Không có phòng trống phù hợp với khoảng thời gian đã chọn.";

            syncQueryString();
            renderRooms(rooms, totalRows, resolvedCurrentPage, resolvedPageSize, message);
        } catch (error) {
            roomTypeElement.textContent = roomTypeId || "Tất cả loại phòng";
            const message = error?.message || "Không thể kiểm tra phòng trống.";
            notifier?.error(message);
            setState(message, true);
        }
    }

    function initializeState() {
        const query = new URLSearchParams(window.location.search);
        state.dateStart = String(query.get("dateStart") || "").trim();
        state.dateEnd = String(query.get("dateEnd") || "").trim();
        state.roomTypeId = String(query.get("roomTypeId") || "").trim();
        state.page = parsePositiveInteger(query.get("page"), 1);
        state.itemsPerPage = parsePositiveInteger(query.get("itemsPerPage"), 6);
        state.sort = String(query.get("sort") || "price-asc").trim().toLowerCase() === "price-desc"
            ? "price-desc"
            : "price-asc";
        sortElement.value = state.sort;
    }

    function handleSortChange(nextValue) {
        const normalizedSort = String(nextValue || "price-asc").trim().toLowerCase();
        const resolvedSort = normalizedSort === "price-desc" ? "price-desc" : "price-asc";
        if (state.sort === resolvedSort) {
            return;
        }

        state.sort = resolvedSort;
        state.page = 1;
        loadAvailableRooms();
    }

    paginationElement.addEventListener("click", event => {
        const button = event.target.closest("[data-page]");
        if (!button) {
            return;
        }

        const totalPages = state.itemsPerPage > 0
            ? Math.max(1, Math.ceil(state.totalRows / state.itemsPerPage))
            : 1;
        const targetPage = Number(button.dataset.page);
        if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage > totalPages || targetPage === state.page) {
            return;
        }

        state.page = targetPage;
        loadAvailableRooms();
    });

    sortElement.addEventListener("change", event => {
        handleSortChange(event.target.value);
    });

    if (window.jQuery) {
        window.jQuery(sortElement).on("change", function () {
            handleSortChange(this.value);
        });
    }

    initializeState();
    loadAvailableRooms();
})();
