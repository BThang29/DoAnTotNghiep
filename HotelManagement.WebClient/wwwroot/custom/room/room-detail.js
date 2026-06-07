
(function () {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const notifier = window.appNotifier;
    const roomDetailCacheKey = "clientRoomDetailPrefetch";
    const stateElement = document.getElementById("roomDetailState");
    const contentElement = document.getElementById("roomDetailContent");
    const sidebarElement = document.getElementById("roomDetailSidebar");

    if (!stateElement || !contentElement || !sidebarElement) {
        return;
    }

    const breadcrumbTitleElement = document.getElementById("roomDetailBreadcrumbTitle");
    const breadcrumbCurrentElement = document.getElementById("roomDetailBreadcrumbCurrent");
    const imageElement = document.getElementById("roomDetailImage");
    const galleryElement = document.querySelector(".rd-gallery");
    const galleryThumbElements = Array.from(document.querySelectorAll(".rd-thumb"));
    const nameElement = document.getElementById("roomDetailName");
    const priceElement = document.getElementById("roomDetailPrice");
    const idElement = document.getElementById("roomDetailId");
    const typeElement = document.getElementById("roomDetailType");
    const statusElement = document.getElementById("roomDetailStatus");
    const availabilityElement = document.getElementById("roomDetailAvailability");
    const summaryElement = document.getElementById("roomDetailSummary");
    const descriptionElement = document.getElementById("roomDetailDescription");
    const bookingActionElement = document.getElementById("roomDetailBookingAction");
    const reviewsStateElement = document.getElementById("roomDetailReviewsState");
    const reviewsListElement = document.getElementById("roomDetailReviewsList");
    const reviewRatingInputElement = document.getElementById("roomDetailReviewRatingInput");
    const reviewRatingStarsElement = document.getElementById("roomDetailReviewRatingStars");
    const submitReviewFormElement = document.getElementById("roomDetailSubmitReviewForm");
    const reviewerNameElement = document.getElementById("roomDetailReviewerName");
    const reviewerEmailElement = document.getElementById("roomDetailReviewerEmail");
    const reviewFeedbackElement = document.getElementById("roomDetailReviewFeedback");
    const submitReviewButtonElement = document.getElementById("roomDetailSubmitReviewButton");
    const sidebarTypeElement = document.getElementById("roomDetailSidebarType");
    const sidebarStatusElement = document.getElementById("roomDetailSidebarStatus");
    const sidebarAvailabilityElement = document.getElementById("roomDetailSidebarAvailability");
    const sidebarPriceElement = document.getElementById("roomDetailSidebarPrice");
    const sidebarActionElement = document.getElementById("roomDetailSidebarAction");
    const galleryAutoIntervalMs = 4500;
    let galleryTimerId = null;
    const pageState = {
        roomId: ""
    };

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
            : `${Number(value).toLocaleString("vi-VN")} VND`;
    }

    function getImagePath(roomId) {
        const normalizedId = Number.parseInt(String(roomId || ""), 10);
        const imageNumber = Number.isFinite(normalizedId)
            ? ((Math.abs(normalizedId) - 1) % 5) + 1
            : 1;

        return `/telly/images/item-large${imageNumber}.jpg`;
    }

    function getGalleryImages() {
        return galleryThumbElements
            .map(thumb => thumb.getAttribute("data-src"))
            .filter(Boolean);
    }

    function getActiveGalleryIndex() {
        const activeIndex = galleryThumbElements.findIndex(thumb => thumb.classList.contains("is-active"));
        return activeIndex >= 0 ? activeIndex : 0;
    }

    function setActiveGalleryThumb(src) {
        galleryThumbElements.forEach(thumb => {
            thumb.classList.toggle("is-active", thumb.getAttribute("data-src") === src);
        });
    }

    function stopGalleryAutoPlay() {
        if (galleryTimerId) {
            window.clearInterval(galleryTimerId);
            galleryTimerId = null;
        }
    }

    function startGalleryAutoPlay() {
        const galleryImages = getGalleryImages();
        stopGalleryAutoPlay();

        if (galleryImages.length <= 1) {
            return;
        }

        galleryTimerId = window.setInterval(() => {
            const nextIndex = (getActiveGalleryIndex() + 1) % galleryImages.length;
            showGalleryImageByIndex(nextIndex, false);
        }, galleryAutoIntervalMs);
    }

    function setGalleryImage(src, resetAutoPlay) {
        if (!imageElement || !src) {
            return;
        }

        setActiveGalleryThumb(src);

        if (imageElement.getAttribute("src") === src) {
            if (resetAutoPlay) {
                startGalleryAutoPlay();
            }
            return;
        }

        imageElement.classList.add("is-switching");

        const nextImage = new Image();
        nextImage.onload = () => {
            imageElement.src = src;
            window.requestAnimationFrame(() => {
                imageElement.classList.remove("is-switching");
            });
        };
        nextImage.onerror = () => {
            imageElement.classList.remove("is-switching");
        };
        nextImage.src = src;

        if (resetAutoPlay) {
            startGalleryAutoPlay();
        }
    }

    function showGalleryImageByIndex(index, resetAutoPlay) {
        const galleryImages = getGalleryImages();

        if (!galleryImages.length) {
            return;
        }

        const safeIndex = ((index % galleryImages.length) + galleryImages.length) % galleryImages.length;
        setGalleryImage(galleryImages[safeIndex], resetAutoPlay);
    }

    function setState(message, isError) {
        stateElement.hidden = false;
        stateElement.className = isError ? "text-center text-danger" : "text-center";
        stateElement.textContent = message;
        contentElement.hidden = true;
        sidebarElement.hidden = true;
    }

    function buildCreateBookingUrl(room) {
        const query = new URLSearchParams();
        const roomId = room?.id ?? room?.Id ?? "";
        const roomName = room?.roomName ?? room?.RoomName ?? "";
        const roomTypeId = room?.roomTypeId ?? room?.RoomTypeId ?? "";
        const price = room?.price ?? room?.Price ?? "";

        if (roomId) {
            query.set("roomId", String(roomId));
        }

        if (roomName) {
            query.set("roomName", String(roomName));
        }

        if (roomTypeId) {
            query.set("roomTypeId", String(roomTypeId));
        }

        if (price !== null && price !== undefined && price !== "") {
            query.set("price", String(price));
        }

        return `/BookingRoom/CreateBooking?${query.toString()}`;
    }

    function formatDate(value) {
        if (!value) {
            return "--";
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return "--";
        }

        return parsed.toLocaleDateString("vi-VN");
    }

    function renderStars(ratingValue) {
        const rating = Math.max(0, Math.min(5, Number(ratingValue) || 0));
        let html = "";

        for (let index = 1; index <= 5; index += 1) {
            if (rating >= index) {
                html += "<i class=\"icon_star\"></i>";
                continue;
            }

            if (rating >= index - 0.5) {
                html += "<i class=\"icon_star-half_alt\"></i>";
                continue;
            }

            html += "<i class=\"icon_star_alt\"></i>";
        }

        return html;
    }

    function normalizeRatingInput(value) {
        const parsed = Number.parseFloat(String(value || "").trim());
        if (!Number.isFinite(parsed)) {
            return null;
        }

        return Math.min(5, Math.max(1, parsed));
    }

    function updateReviewRatingPreview(rawValue) {
        if (!reviewRatingInputElement || !reviewRatingStarsElement) {
            return;
        }

        const normalizedRating = normalizeRatingInput(rawValue);
        if (normalizedRating === null) {
            reviewRatingStarsElement.innerHTML = renderStars(0);
            return;
        }

        reviewRatingInputElement.value = String(normalizedRating);
        reviewRatingStarsElement.innerHTML = renderStars(normalizedRating);
    }

    function getAuthSession() {
        return window.webAppClientAuth?.getSession?.() || null;
    }

    function getAuthHeaders(contentType) {
        const session = getAuthSession();
        const headers = {};

        if (contentType) {
            headers["Content-Type"] = contentType;
        }

        if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
        }

        return headers;
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

    function getResponseMessage(response, data, fallbackMessage) {
        if (response.status === 401) {
            return "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.";
        }

        return data?.message || data?.Message || fallbackMessage;
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

    function isCompletedBooking(item) {
        const rawStatus = String(item?.status ?? item?.Status ?? "").trim().toLowerCase();
        if (rawStatus.includes("upcoming") || rawStatus.includes("ongoing") || rawStatus.includes("cho")) {
            return false;
        }

        const endDateValue = item?.dateEnd ?? item?.DateEnd ?? null;
        if (!endDateValue) {
            return true;
        }

        const endDate = new Date(endDateValue);
        if (Number.isNaN(endDate.getTime())) {
            return true;
        }

        return endDate.getTime() < Date.now();
    }

    async function findReviewableBooking(roomId) {
        const session = getAuthSession();
        if (!session?.accessToken) {
            throw new Error("Vui lòng đăng nhập để gửi đánh giá.");
        }

        const mail = String(session.email || "").trim();
        const phone = String(session.phoneNumber || "").trim();
        if (!mail && !phone) {
            throw new Error("Không tìm thấy thông tin tài khoản để đối chiếu booking.");
        }

        const params = new URLSearchParams({
            Page: "1",
            ItemsPerPage: "100",
            SortBy: "DateEnd",
            SortDesc: "true"
        });

        if (mail) {
            params.set("Mail", mail);
        } else {
            params.set("Phone", phone);
        }

        const response = await fetch(`${apiBaseUrl}/api/client/booking-history?${params.toString()}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        const data = await parseJsonResponse(response);

        if (!response.ok) {
            throw new Error(getResponseMessage(response, data, "Không thể kiểm tra lịch sử đặt phòng."));
        }

        const result = data?.resultObj ?? data?.ResultObj ?? {};
        const items = Array.isArray(result?.data) ? result.data : Array.isArray(result?.Data) ? result.Data : [];
        const matchedBooking = items.find(item => {
            const bookingRoomId = item?.roomId ?? item?.RoomId ?? 0;
            return Number(bookingRoomId) === Number(roomId) && isCompletedBooking(item);
        });

        if (!matchedBooking) {
            throw new Error("Bạn chỉ có thể review sau khi đã hoàn tất lưu trú cho phòng này.");
        }

        return {
            bookingId: Number(matchedBooking?.bookingId ?? matchedBooking?.BookingId ?? 0),
            customerId: matchedBooking?.customerId ?? matchedBooking?.CustomerId ?? null,
            customerName: matchedBooking?.customerName ?? matchedBooking?.CustomerName ?? "",
            customerMail: matchedBooking?.customerMail ?? matchedBooking?.CustomerMail ?? "",
            customerPhone: matchedBooking?.customerPhone ?? matchedBooking?.CustomerPhone ?? ""
        };
    }

    async function submitReview() {
        const session = getAuthSession();
        if (!session?.accessToken) {
            notifier?.warning("Vui lòng đăng nhập trước khi gửi đánh giá.");
            return;
        }

        if (!pageState.roomId) {
            notifier?.error("Không xác định được phòng để gửi đánh giá.");
            return;
        }

        const ratingValue = normalizeRatingInput(reviewRatingInputElement?.value);
        if (ratingValue === null) {
            notifier?.warning("Vui lòng nhập số sao hợp lệ từ 1 đến 5.");
            return;
        }

        const feedback = String(reviewFeedbackElement?.value || "").trim();
        if (!feedback) {
            notifier?.warning("Vui lòng nhập nội dung đánh giá.");
            return;
        }

        submitReviewButtonElement.disabled = true;

        try {
            const booking = await findReviewableBooking(pageState.roomId);

            if (reviewerNameElement && !reviewerNameElement.value) {
                reviewerNameElement.value = booking.customerName || session.fullName || session.username || "";
            }

            if (reviewerEmailElement && !reviewerEmailElement.value) {
                reviewerEmailElement.value = booking.customerMail || session.email || "";
            }

            const payload = {
                BookingId: booking.bookingId,
                CustomerId: booking.customerId,
                Phone: booking.customerPhone || session.phoneNumber || null,
                Rating: ratingValue,
                Feedback: feedback
            };

            const response = await fetch(`${apiBaseUrl}/api/client/review`, {
                method: "POST",
                headers: getAuthHeaders("application/json"),
                body: JSON.stringify(payload)
            });
            const data = await parseJsonResponse(response);

            if (!response.ok) {
                throw new Error(getResponseMessage(response, data, "Không thể gửi đánh giá."));
            }

            notifier?.success(data?.message || data?.Message || "Gửi đánh giá thành công.");
            if (reviewFeedbackElement) {
                reviewFeedbackElement.value = "";
            }

            await loadReviews(pageState.roomId);
        } catch (error) {
            notifier?.error(error?.message || "Không thể gửi đánh giá.");
        } finally {
            submitReviewButtonElement.disabled = false;
        }
    }

    function setReviewsState(message, isError) {
        if (!reviewsStateElement || !reviewsListElement) {
            return;
        }

        reviewsStateElement.hidden = false;
        reviewsStateElement.className = isError ? "text-danger" : "text-muted";
        reviewsStateElement.textContent = message;
        reviewsListElement.innerHTML = "";
    }

    function renderReviews(reviews) {
        if (!reviewsStateElement || !reviewsListElement) {
            return;
        }

        const normalizedReviews = Array.isArray(reviews) ? reviews : [];
        if (normalizedReviews.length === 0) {
            setReviewsState("Phòng này chưa có review.", false);
            return;
        }

        reviewsListElement.innerHTML = normalizedReviews.map((review, index) => {
            const customerName = review?.customerName ?? review?.CustomerName ?? "Khách hàng";
            const feedback = review?.feedback ?? review?.Feedback ?? "";
            const rating = review?.rating ?? review?.Rating ?? 0;
            const createdAt = review?.createdAt ?? review?.CreatedAt ?? "";
            const avatarNumber = (index % 3) + 1;

            return `
                <div class="review-item">
                    <div class="ri-pic">
                        <img src="/telly/images/commentor-item${avatarNumber}.jpg" alt="${escapeHtml(customerName)}">
                    </div>
                    <div class="ri-text">
                        <span>${escapeHtml(formatDate(createdAt))}</span>
                        <div class="rating">
                            ${renderStars(rating)}
                        </div>
                        <h5>${escapeHtml(customerName)}</h5>
                        <p>${escapeHtml(feedback || "Khách hàng chưa để lại nội dung đánh giá.")}</p>
                    </div>
                </div>`;
        }).join("");

        reviewsStateElement.hidden = true;
    }

    async function loadReviews(roomId) {
        if (!roomId || !reviewsStateElement || !reviewsListElement) {
            return;
        }

        setReviewsState("Đang tải review...", false);

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/review/room/${encodeURIComponent(String(roomId))}?take=10`);
            const data = await parseJsonResponse(response);

            if (!response.ok) {
                throw new Error(getResponseMessage(response, data, "Không thể tải review của phòng."));
            }

            const reviews = Array.isArray(data?.resultObj)
                ? data.resultObj
                : Array.isArray(data?.ResultObj)
                    ? data.ResultObj
                    : [];

            renderReviews(reviews);
        } catch (error) {
            setReviewsState(error?.message || "Không thể tải review của phòng.", true);
        }
    }

    function renderRoom(room) {
        const roomId = room?.id ?? room?.Id ?? "";
        const roomName = room?.roomName ?? room?.RoomName ?? `Room #${roomId}`;
        const roomTypeId = room?.roomTypeId ?? room?.RoomTypeId ?? "";
        const roomStatusId = room?.roomStatusId ?? room?.RoomStatusId ?? "";
        const roomStatusName = room?.roomStatusName ?? room?.RoomStatusName ?? "Đang cập nhật";
        const isAvailable = resolveRoomAvailability(room);
        const price = room?.price ?? room?.Price ?? null;
        const availabilityText = isAvailable ? "Còn phòng" : "Không khả dụng";
        const createBookingUrl = buildCreateBookingUrl(room);

        if (breadcrumbTitleElement) {
            breadcrumbTitleElement.textContent = roomName;
        }

        if (breadcrumbCurrentElement) {
            breadcrumbCurrentElement.textContent = roomName;
        }

        if (imageElement) {
            setGalleryImage(getImagePath(roomId), false);
            imageElement.alt = roomName;
        }

        if (nameElement) {
            nameElement.textContent = roomName;
        }

        if (priceElement) {
            priceElement.innerHTML = `${escapeHtml(formatPrice(price))}<span>/đêm</span>`;
        }

        if (idElement) {
            idElement.textContent = `#${roomId}`;
        }

        if (typeElement) {
            typeElement.textContent = roomTypeId || "--";
        }

        if (statusElement) {
            statusElement.textContent = roomStatusName || "--";
        }

        if (availabilityElement) {
            availabilityElement.textContent = availabilityText;
        }

        if (summaryElement) {
            summaryElement.textContent = `${roomName} thuộc loại ${roomTypeId || "--"}, phù hợp cho khách cần một lựa chọn rõ ràng về giá và tình trạng phòng trước khi đặt.`;
        }

        if (descriptionElement) {
            descriptionElement.textContent = `Phòng hiện đang ở trạng thái ${String(roomStatusName || "--").toLowerCase()} và ${availabilityText.toLowerCase()}. Để xem thêm lựa chọn cùng loại, bạn có thể quay lại danh sách phòng.`;
        }

        if (bookingActionElement) {
            bookingActionElement.href = isAvailable ? createBookingUrl : "#";
            bookingActionElement.textContent = isAvailable ? "ĐẶT PHÒNG NGAY" : "KHÔNG KHẢ DỤNG";
            bookingActionElement.setAttribute("aria-disabled", isAvailable ? "false" : "true");
            bookingActionElement.classList.toggle("disabled", !isAvailable);
            bookingActionElement.tabIndex = isAvailable ? 0 : -1;
        }

        if (sidebarTypeElement) {
            sidebarTypeElement.textContent = roomTypeId || "--";
        }

        if (sidebarStatusElement) {
            sidebarStatusElement.textContent = roomStatusId || "--";
        }

        if (sidebarAvailabilityElement) {
            sidebarAvailabilityElement.textContent = availabilityText;
        }

        if (sidebarPriceElement) {
            sidebarPriceElement.textContent = formatPrice(price);
        }

        if (sidebarActionElement) {
            sidebarActionElement.href = isAvailable ? createBookingUrl : "#";
            sidebarActionElement.textContent = isAvailable ? "ĐẶT PHÒNG NGAY" : "KHÔNG KHẢ DỤNG";
            sidebarActionElement.setAttribute("aria-disabled", isAvailable ? "false" : "true");
            sidebarActionElement.classList.toggle("disabled", !isAvailable);
            sidebarActionElement.tabIndex = isAvailable ? 0 : -1;
        }

        pageState.roomId = String(roomId || "");
        stateElement.hidden = true;
        contentElement.hidden = false;
        sidebarElement.hidden = false;
    }

    async function loadRoomDetail() {
        const query = new URLSearchParams(window.location.search);
        const roomId = String(query.get("roomId") || "").trim();

        if (!roomId) {
            const message = "Không tìm thấy mã phòng trong đường dẫn.";
            notifier?.warning(message);
            setState(message, true);
            return;
        }

        const cachedPayload = window.sessionStorage.getItem(roomDetailCacheKey);
        if (cachedPayload) {
            try {
                const cachedData = JSON.parse(cachedPayload);
                if (String(cachedData?.roomId || "") === roomId && cachedData?.room) {
                    renderRoom(cachedData.room);
                    window.sessionStorage.removeItem(roomDetailCacheKey);
                    loadReviews(roomId);
                    return;
                }
            } catch (error) {
                window.sessionStorage.removeItem(roomDetailCacheKey);
            }
        }

        setState("Đang tải chi tiết phòng...", false);

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/room/${encodeURIComponent(roomId)}`);
            const data = await parseJsonResponse(response);

            if (!response.ok) {
                throw new Error(getResponseMessage(response, data, "Không thể tải chi tiết phòng."));
            }

            const room = data?.resultObj ?? data?.ResultObj;
            if (!room) {
                throw new Error("Không tìm thấy chi tiết phòng.");
            }

            renderRoom(room);
            loadReviews(roomId);
        } catch (error) {
            const message = error?.message || "Không thể tải chi tiết phòng.";
            notifier?.error(message);
            setState(message, true);
        }
    }

    if (reviewRatingInputElement && reviewRatingStarsElement) {
        reviewRatingInputElement.addEventListener("input", event => {
            updateReviewRatingPreview(event.target.value);
        });

        reviewRatingInputElement.addEventListener("change", event => {
            updateReviewRatingPreview(event.target.value);
        });

        updateReviewRatingPreview(reviewRatingInputElement.value);
    }

    if (submitReviewFormElement) {
        submitReviewFormElement.addEventListener("submit", async event => {
            event.preventDefault();
            await submitReview();
        });
    }

    galleryThumbElements.forEach((thumb, index) => {
        thumb.addEventListener("click", () => {
            showGalleryImageByIndex(index, true);
        });
    });

    if (galleryElement) {
        galleryElement.addEventListener("mouseenter", stopGalleryAutoPlay);
        galleryElement.addEventListener("mouseleave", startGalleryAutoPlay);
    }

    startGalleryAutoPlay();
    loadRoomDetail();
})();
