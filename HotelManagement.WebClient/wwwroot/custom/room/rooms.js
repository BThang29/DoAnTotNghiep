
(function () {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const stateElement = document.getElementById("roomsState");
    const gridElement = document.getElementById("roomsGrid");
    const summaryElement = document.getElementById("roomsSummary");
    const paginationWrapperElement = document.getElementById("roomsPaginationWrapper");
    const paginationElement = document.getElementById("roomsPagination");
    const notifier = window.appNotifier;
    const roomDetailCacheKey = "clientRoomDetailPrefetch";
    const state = {
        page: 1,
        itemsPerPage: 9
    };

    if (!stateElement || !gridElement || !paginationWrapperElement || !paginationElement) {
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

    function parsePositiveInteger(value, fallbackValue) {
        const parsedValue = Number.parseInt(String(value || ""), 10);
        return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
    }

    function formatPrice(value) {
        return value === null || value === undefined
            ? "Liên hệ"
            : Number(value).toLocaleString("vi-VN");
    }

    function setState(message, isError) {
        stateElement.hidden = false;
        gridElement.hidden = true;
        paginationWrapperElement.hidden = true;
        paginationElement.innerHTML = "";
        if (summaryElement) {
            summaryElement.hidden = true;
            summaryElement.innerHTML = "";
        }
        stateElement.className = isError ? "text-danger text-center" : "text-center";
        stateElement.textContent = message;
    }

    function getImagePath(index) {
        const imageNumber = (index % 5) + 1;
        return `/telly/images/item-large${imageNumber}.jpg`;
    }

    function isRoomAvailableByStatus(roomStatusId) {
        return String(roomStatusId || "").trim().toUpperCase() === "AVAILABLE";
    }

    function resolveRoomAvailability(room) {
        if (typeof room?.isAvailable === "boolean") {
            return room.isAvailable;
        }

        if (typeof room?.IsAvailable === "boolean") {
            return room.IsAvailable;
        }

        return isRoomAvailableByStatus(room?.roomStatusId ?? room?.RoomStatusId ?? "");
    }

    function syncQueryString() {
        const query = new URLSearchParams(window.location.search);
        query.set("page", String(state.page));
        query.set("itemsPerPage", String(state.itemsPerPage));
        window.history.replaceState({}, "", `${window.location.pathname}?${query.toString()}`);
    }

    async function prefetchRoomDetail(roomId) {
        const response = await fetch(`${apiBaseUrl}/api/client/room/${encodeURIComponent(String(roomId))}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || data?.Message || "Không thể tải chi tiết phòng.");
        }

        const room = data?.resultObj ?? data?.ResultObj;
        if (!room) {
            throw new Error("Không tìm thấy chi tiết phòng.");
        }

        window.sessionStorage.setItem(roomDetailCacheKey, JSON.stringify({
            roomId: String(roomId),
            room
        }));
    }

    function createPaginationLink(label, page, disabled, active, kind) {
        const classNames = ["room-pagination__link"];
        if (active) {
            classNames.push("active");
        }
        if (disabled) {
            classNames.push("is-disabled");
        }
        if (kind) {
            classNames.push(`is-${kind}`);
        }
        const activeClass = ` class="${classNames.join(" ")}"`;
        const disabledAttr = disabled ? " aria-disabled=\"true\"" : "";
        return `<a href="#" data-page="${page}"${activeClass}${disabledAttr}>${label}</a>`;
    }

    function renderPagination(totalRows) {
        const totalPages = state.itemsPerPage > 0
            ? Math.max(1, Math.ceil(totalRows / state.itemsPerPage))
            : 1;

        if (totalPages <= 1) {
            paginationWrapperElement.hidden = true;
            paginationElement.innerHTML = "";
            return;
        }

        const items = [];
        if (state.page > 1) {
            items.push(createPaginationLink("<i class=\"fa fa-long-arrow-left\"></i>Trước", state.page - 1, false, false, "prev"));
        }

        for (let page = 1; page <= totalPages; page += 1) {
            items.push(createPaginationLink(String(page), page, false, page === state.page, "page"));
        }

        if (state.page < totalPages) {
            items.push(createPaginationLink("Tiếp<i class=\"fa fa-long-arrow-right\"></i>", state.page + 1, false, false, "next"));
        }

        paginationElement.innerHTML = items.join("");
        paginationWrapperElement.hidden = false;
    }

    function renderRooms(rooms, totalRows, currentPage, pageSize) {
        const normalizedRooms = Array.isArray(rooms) ? rooms : [];
        state.page = currentPage;
        state.itemsPerPage = pageSize;

        if (normalizedRooms.length === 0) {
            setState("Không tìm thấy phòng phù hợp.", false);
            return;
        }

        if (summaryElement) {
            const startRow = ((currentPage - 1) * pageSize) + 1;
            const endRow = Math.min(totalRows, currentPage * pageSize);
            summaryElement.hidden = false;
            summaryElement.innerHTML = `
                <span>Hiển thị <strong>${escapeHtml(startRow)}-${escapeHtml(endRow)}</strong> trong <strong>${escapeHtml(totalRows)}</strong> phòng</span>
                <span>Trang <strong>${escapeHtml(currentPage)}</strong></span>`;
        }

        gridElement.innerHTML = normalizedRooms.map((room, index) => {
            const roomId = room?.id ?? room?.Id ?? "";
            const roomName = room?.roomName ?? room?.RoomName ?? "";
            const roomTypeId = room?.roomTypeId ?? room?.RoomTypeId ?? "";
            const roomStatusId = room?.roomStatusId ?? room?.RoomStatusId ?? "";
            const roomStatusName = room?.roomStatusName ?? room?.RoomStatusName ?? "";
            const isAvailable = resolveRoomAvailability(room);
            const statusLabel = isAvailable ? "Còn phòng" : "Hết phòng";
            const statusClass = isAvailable ? "is-available" : "is-unavailable";
            const price = room?.price ?? room?.Price ?? null;
            const imagePath = getImagePath(((state.page - 1) * state.itemsPerPage) + index);

            const detailUrl = `/Room/RoomDetail?roomId=${encodeURIComponent(String(roomId))}`;
            return `
                <div class="col-lg-4 col-md-6">
                    <article class="tl-room-card ${statusClass}">
                        <a class="tl-room-card__img room-detail-trigger" href="${detailUrl}" data-room-id="${escapeHtml(roomId)}">
                            <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(roomName)}">
                            <span class="tl-room-card__badge ${isAvailable ? "is-on" : "is-off"}">
                                <span></span>${statusLabel}
                            </span>
                            <span class="tl-room-card__peek">Xem phòng</span>
                        </a>
                        <div class="tl-room-card__body">
                            <div class="tl-room-card__topline">
                                <span class="tl-room-card__type">${escapeHtml(roomTypeId || "Phòng nghỉ")}</span>
                                <span class="tl-room-card__code">#${escapeHtml(roomId)}</span>
                            </div>
                            <h3 class="tl-room-card__title">
                                <a class="room-detail-trigger" href="${detailUrl}" data-room-id="${escapeHtml(roomId)}">${escapeHtml(roomName || `Phòng #${roomId}`)}</a>
                            </h3>
                            <div class="tl-room-card__price">${escapeHtml(formatPrice(price))} <small>VND / đêm</small></div>
                            <div class="tl-room-card__facts">
                                <div><i class="fa fa-hashtag"></i><span>Mã phòng</span><strong>#${escapeHtml(roomId)}</strong></div>
                                <div><i class="fa fa-bed"></i><span>Loại</span><strong>${escapeHtml(roomTypeId || "—")}</strong></div>
                            </div>
                            <div class="tl-room-card__status-note ${isAvailable ? "is-on" : "is-off"}">
                                <i class="fa ${isAvailable ? "fa-check-circle" : "fa-clock-o"}"></i>
                                <span>${escapeHtml(roomStatusName || statusLabel)}</span>
                            </div>
                            <a href="${detailUrl}" class="tl-room-card__btn room-detail-trigger" data-room-id="${escapeHtml(roomId)}">Xem chi tiết <i class="fa fa-long-arrow-right"></i></a>
                        </div>
                    </article>
                </div>`;
        }).join("");

        stateElement.hidden = true;
        gridElement.hidden = false;
        syncQueryString();
        renderPagination(totalRows);
    }

    async function loadRooms() {
        setState("Đang tải danh sách phòng...", false);

        try {
            const query = new URLSearchParams({
                Page: String(state.page),
                ItemsPerPage: String(state.itemsPerPage)
            });

            const response = await fetch(`${apiBaseUrl}/api/client/room?${query.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || "Không thể tải danh sách phòng.");
            }

            const pageResult = data?.resultObj ?? data?.ResultObj ?? {};
            const rooms = Array.isArray(pageResult?.data) ? pageResult.data : Array.isArray(pageResult?.Data) ? pageResult.Data : [];
            const totalRows = parsePositiveInteger(pageResult?.totalRows ?? pageResult?.TotalRows, 0);
            const currentPage = parsePositiveInteger(pageResult?.currentPage ?? pageResult?.CurrentPage, state.page);
            const pageSize = parsePositiveInteger(pageResult?.pageSize ?? pageResult?.PageSize, state.itemsPerPage);

            renderRooms(rooms, totalRows, currentPage, pageSize);
        } catch (error) {
            const message = error?.message || "Không thể tải danh sách phòng.";
            notifier?.error(message);
            setState(message, true);
        }
    }

    function initializeState() {
        const query = new URLSearchParams(window.location.search);
        state.page = parsePositiveInteger(query.get("page"), 1);
        state.itemsPerPage = parsePositiveInteger(query.get("itemsPerPage"), 9);
    }

    paginationElement.addEventListener("click", event => {
        const link = event.target.closest("[data-page]");
        if (!link) {
            return;
        }

        event.preventDefault();

        const nextPage = Number.parseInt(String(link.dataset.page || ""), 10);
        if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage === state.page) {
            return;
        }

        state.page = nextPage;
        loadRooms();
    });

    gridElement.addEventListener("click", async event => {
        const trigger = event.target.closest(".room-detail-trigger");
        if (!trigger) {
            return;
        }

        event.preventDefault();

        const roomId = String(trigger.dataset.roomId || "").trim();
        const nextUrl = String(trigger.getAttribute("href") || "").trim();
        if (!roomId || !nextUrl) {
            return;
        }

        const originalHtml = trigger.innerHTML;
        trigger.innerHTML = "Đang tải...";
        trigger.style.pointerEvents = "none";

        try {
            await prefetchRoomDetail(roomId);
        } catch (error) {
            notifier?.error(error?.message || "Không thể tải chi tiết phòng.");
        } finally {
            trigger.innerHTML = originalHtml;
            trigger.style.pointerEvents = "";
            window.location.href = nextUrl;
        }
    });

    initializeState();
    loadRooms();
})();
