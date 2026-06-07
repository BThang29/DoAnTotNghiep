(function () {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const stateElement = document.getElementById("homeFeaturedRoomsState");
    const contentElement = document.getElementById("homeFeaturedRoomsContent");
    const notifier = window.appNotifier;
    const roomDetailCacheKey = "clientRoomDetailPrefetch";

    if (!stateElement || !contentElement) {
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

    function formatPrice(value) {
        return value === null || value === undefined
            ? "Liên hệ"
            : Number(value).toLocaleString("vi-VN");
    }

    function getImagePath(index) {
        const imageNumber = (index % 5) + 1;
        return `/telly/images/item${imageNumber}.jpg`;
    }

    function setState(message, isError) {
        stateElement.hidden = false;
        stateElement.className = isError ? "text-center text-danger" : "text-center";
        stateElement.textContent = message;
        contentElement.innerHTML = "";
    }

    function isNetworkError(error) {
        const message = String(error?.message || "").trim().toLowerCase();
        return error instanceof TypeError || message.includes("failed to fetch") || message.includes("networkerror");
    }

    function delay(milliseconds) {
        return new Promise(resolve => {
            window.setTimeout(resolve, milliseconds);
        });
    }

    async function parseJsonResponse(response) {
        const rawText = await response.text();
        if (!rawText) {
            return null;
        }

        try {
            return JSON.parse(rawText);
        } catch (error) {
            return null;
        }
    }

    async function fetchJsonWithRetry(url, retries, retryDelayMs) {
        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            try {
                const response = await fetch(url);
                const data = await parseJsonResponse(response);

                if (!response.ok) {
                    throw new Error(data?.message || data?.Message || "Không thể tải dữ liệu.");
                }

                return data;
            } catch (error) {
                lastError = error;
                if (!isNetworkError(error) || attempt >= retries) {
                    break;
                }

                await delay(retryDelayMs);
            }
        }

        throw lastError || new Error("Không thể tải dữ liệu.");
    }

    async function prefetchRoomDetail(roomId) {
        const data = await fetchJsonWithRetry(
            `${apiBaseUrl}/api/client/room/${encodeURIComponent(String(roomId))}`,
            1,
            500
        );

        const room = data?.resultObj ?? data?.ResultObj;
        if (!room) {
            throw new Error("Không tìm thấy chi tiết phòng.");
        }

        window.sessionStorage.setItem(roomDetailCacheKey, JSON.stringify({
            roomId: String(roomId),
            room
        }));
    }

    function renderRooms(rooms) {
        const normalizedRooms = Array.isArray(rooms) ? rooms : [];

        if (normalizedRooms.length === 0) {
            setState("Chưa có dữ liệu phòng để hiển thị.", false);
            return;
        }

        contentElement.innerHTML = `
            <div class="hp-room-items">
                <div class="row">
                    ${normalizedRooms.map((room, index) => {
                        const roomId = room?.id ?? room?.Id ?? "";
                        const roomName = room?.roomName ?? room?.RoomName ?? "";
                        const roomTypeId = room?.roomTypeId ?? room?.RoomTypeId ?? "";
                        const roomTypeName = room?.roomTypeName ?? room?.RoomTypeName ?? roomTypeId ?? "Loại phòng";
                        const roomStatusName = room?.roomStatusName ?? room?.RoomStatusName ?? "";
                        const isAvailable = Boolean(room?.isAvailable ?? room?.IsAvailable);
                        const price = room?.price ?? room?.Price ?? null;
                        const imagePath = getImagePath(index);

                        return `
                            <div class="col-lg-3 col-md-6">
                                <div class="hp-room-item" style="background-image: url('${escapeHtml(imagePath)}');">
                                    <div class="hr-text">
                                        <h3>${escapeHtml(roomTypeId || roomTypeName)}</h3>
                                        <h2>${escapeHtml(formatPrice(price))} VND<span>/đêm</span></h2>
                                        <table>
                                            <tbody>
                                                <tr>
                                                    <td class="r-o">Phòng:</td>
                                                    <td>${escapeHtml(roomName || `#${roomId}`)}</td>
                                                </tr>
                                                <tr>
                                                    <td class="r-o">Loại:</td>
                                                    <td>${escapeHtml(roomTypeId || roomTypeName)}</td>
                                                </tr>
                                                <tr>
                                                    <td class="r-o">Trạng thái:</td>
                                                    <td>${escapeHtml(roomStatusName || (isAvailable ? "Sẵn sàng" : "Đang cập nhật"))}</td>
                                                </tr>
                                                <tr>
                                                    <td class="r-o">Khả dụng:</td>
                                                    <td>${isAvailable ? "Còn phòng" : "Không khả dụng"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <a href="/Room/RoomDetail?roomId=${encodeURIComponent(String(roomId))}" class="primary-btn home-room-detail-trigger" data-room-id="${escapeHtml(roomId)}">Xem chi tiết</a>
                                    </div>
                                </div>
                            </div>`;
                    }).join("")}
                </div>
            </div>`;

        stateElement.hidden = true;
    }

    async function loadFeaturedRooms() {
        setState("Đang tải danh sách phòng...", false);

        try {
            const data = await fetchJsonWithRetry(
                `${apiBaseUrl}/api/client/room?Page=1&ItemsPerPage=4`,
                2,
                700
            );

            const pageResult = data?.resultObj ?? data?.ResultObj ?? {};
            const rooms = Array.isArray(pageResult?.data)
                ? pageResult.data
                : Array.isArray(pageResult?.Data)
                    ? pageResult.Data
                    : [];

            renderRooms(rooms);
        } catch (error) {
            const message = isNetworkError(error)
                ? "Không kết nối được đến hệ thống phòng. Vui lòng đợi trong giây lát."
                : (error?.message || "Không thể tải danh sách phòng.");
            setState(message, true);
        }
    }

    contentElement.addEventListener("click", async event => {
        const trigger = event.target.closest(".home-room-detail-trigger");
        if (!trigger) {
            return;
        }

        event.preventDefault();

        const roomId = String(trigger.dataset.roomId || "").trim();
        const nextUrl = String(trigger.getAttribute("href") || "").trim();
        if (!roomId || !nextUrl) {
            return;
        }

        const originalText = trigger.textContent;
        trigger.textContent = "Đang tải...";
        trigger.style.pointerEvents = "none";

        try {
            await prefetchRoomDetail(roomId);
        } catch (error) {
            if (!isNetworkError(error)) {
                notifier?.error(error?.message || "Không thể tải chi tiết phòng.");
            }
        } finally {
            trigger.textContent = originalText;
            trigger.style.pointerEvents = "";
            window.location.href = nextUrl;
        }
    });

    loadFeaturedRooms();
})();
