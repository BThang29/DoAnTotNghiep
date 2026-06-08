
(function () {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const notifier = window.appNotifier;
    const formElement = document.getElementById("bookingRoomForm");
    const stateElement = document.getElementById("bookingRoomState");
    const submitButtonElement = document.getElementById("bookingRoomSubmitButton");
    const useSessionButtonElement = document.getElementById("bookingRoomUseSessionButton");
    const loginLinkElement = document.getElementById("bookingRoomLoginLink");
    const authNoteElement = document.getElementById("bookingRoomAuthNote");
    const summaryNameElement = document.getElementById("bookingRoomSummaryName");
    const summaryPriceElement = document.getElementById("bookingRoomSummaryPrice");
    const summaryIdElement = document.getElementById("bookingRoomSummaryId");
    const summaryTypeElement = document.getElementById("bookingRoomSummaryType");
    const summaryDatesElement = document.getElementById("bookingRoomSummaryDates");
    const summaryStatusElement = document.getElementById("bookingRoomSummaryStatus");
    const summaryDescriptionElement = document.getElementById("bookingRoomSummaryDescription");
    const imageElement = document.getElementById("bookingRoomImage");
    const fields = {
        fullName: document.getElementById("bookingRoomFullName"),
        identify: document.getElementById("bookingRoomIdentify"),
        phone: document.getElementById("bookingRoomPhone"),
        mail: document.getElementById("bookingRoomMail"),
        dob: document.getElementById("bookingRoomDob"),
        deposit: document.getElementById("bookingRoomDeposit"),
        dateStart: document.getElementById("bookingRoomDateStart"),
        dateEnd: document.getElementById("bookingRoomDateEnd"),
        voucherId: document.getElementById("bookingRoomVoucherId")
    };
    const state = {
        roomId: 0,
        roomName: "",
        roomTypeId: "",
        roomStatusId: "",
        price: null,
        dateStart: "",
        dateEnd: "",
        lastNotificationKey: "",
        lastNotificationAt: 0,
        lastDobValidationValue: "",
        lastDobValidationMessage: ""
    };

    if (!formElement || !stateElement || !submitButtonElement) {
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

    function formatPrice(value) {
        return value === null || value === undefined || value === ""
            ? "Liên hệ"
            : `${Number(value).toLocaleString("vi-VN")} VND`;
    }

    function formatDisplayDate(value) {
        if (!value) {
            return "--";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "--";
        }

        return date.toLocaleDateString("vi-VN");
    }

    function getTodayIsoDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getImagePath(roomId) {
        const resolvedId = Number.parseInt(String(roomId || ""), 10);
        const imageNumber = Number.isFinite(resolvedId)
            ? ((Math.abs(resolvedId) - 1) % 6) + 1
            : 1;
        return `/images/room/room-${imageNumber}.jpg`;
    }

    function getAuthSession() {
        return window.webAppClientAuth?.getSession?.() || null;
    }

    function getAuthHeaders() {
        const session = getAuthSession();
        const headers = {
            "Content-Type": "application/json"
        };

        if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
        }

        return headers;
    }

    function getCurrentCreateBookingUrl() {
        const path = String(window.location.pathname || "").trim() || "/BookingRoom/CreateBooking";
        const query = String(window.location.search || "").trim();
        return `${path}${query}`;
    }

    function buildLoginUrl() {
        const query = new URLSearchParams();
        query.set("returnUrl", getCurrentCreateBookingUrl());
        return `/Auth/Login?${query.toString()}`;
    }

    function redirectToLogin(message) {
        const redirectUrl = buildLoginUrl();
        if (message) {
            notify("warning", message, "booking-room-login-required");
        }

        window.setTimeout(() => {
            window.location.href = redirectUrl;
        }, 150);
    }

    function setState(message, isError) {
        stateElement.className = isError ? "booking-room-state text-danger" : "booking-room-state";
        stateElement.textContent = message;
    }

    function notify(type, message, dedupeKey) {
        const now = Date.now();
        const notificationKey = `${type}:${dedupeKey || message}`;

        if (state.lastNotificationKey === notificationKey && now - state.lastNotificationAt < 800) {
            return;
        }

        state.lastNotificationKey = notificationKey;
        state.lastNotificationAt = now;

        if (type === "warning") {
            notifier?.warning?.(message);
            return;
        }

        if (type === "success") {
            notifier?.success?.(message);
            return;
        }

        notifier?.error?.(message);
    }

    function parseIsoDateInput(value) {
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

    function validateDobValue(value) {
        const trimmedValue = String(value || "").trim();
        if (!trimmedValue) {
            return "";
        }

        const dob = parseIsoDateInput(trimmedValue);
        if (!dob) {
            return "Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng yyyy-mm-dd.";
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dob.getFullYear() > today.getFullYear()) {
            return "Năm sinh không được lớn hơn năm hiện tại.";
        }

        const minimumAdultDob = new Date(today);
        minimumAdultDob.setFullYear(minimumAdultDob.getFullYear() - 18);

        if (dob > minimumAdultDob) {
            return "Khách hàng phải đủ 18 tuổi trở lên.";
        }

        return "";
    }

    function notifyDobValidation() {
        const currentDobValue = String(fields.dob?.value || "").trim();
        const validationMessage = validateDobValue(currentDobValue);
        if (!validationMessage) {
            state.lastDobValidationValue = currentDobValue;
            state.lastDobValidationMessage = "";
            return "";
        }

        if (state.lastDobValidationValue === currentDobValue
            && state.lastDobValidationMessage === validationMessage) {
            return validationMessage;
        }

        state.lastDobValidationValue = currentDobValue;
        state.lastDobValidationMessage = validationMessage;
        notify("warning", validationMessage, "booking-room-dob");
        setState(validationMessage, true);
        return validationMessage;
    }

    function isRoomAvailable() {
        return String(state.roomStatusId || "").trim().toUpperCase() === "AVAILABLE";
    }

    function syncBookingAvailability() {
        const hasRoomStatus = Boolean(String(state.roomStatusId || "").trim());
        const roomAvailable = isRoomAvailable();

        submitButtonElement.disabled = hasRoomStatus && !roomAvailable;

        if (hasRoomStatus && !roomAvailable) {
            setState(`Phòng hiện tại có trạng thái ${state.roomStatusId} nên không thể đặt.`, true);
            return;
        }

        if (hasRoomStatus && roomAvailable && stateElement.classList.contains("text-danger") && stateElement.textContent.includes("trang thai")) {
            setState("", false);
        }
    }

    function populateFromSession() {
        const session = getAuthSession();
        if (!session?.accessToken) {
            redirectToLogin("Vui lòng đăng nhập để tiếp tục tạo booking.");
            return;
        }

        fields.fullName.value = session.fullName || session.username || "";
        fields.phone.value = session.phoneNumber || "";
        fields.mail.value = session.email || "";
        setState("Đã nạp dữ liệu từ tài khoản đăng nhập.", false);
    }

    function syncAuthState() {
        const session = getAuthSession();
        const isLoggedIn = Boolean(session?.accessToken);
        const loginUrl = buildLoginUrl();

        if (authNoteElement) {
            authNoteElement.textContent = isLoggedIn
                ? "Bạn đã đăng nhập. Có thể dùng nhanh dữ liệu tài khoản hoặc chỉnh sửa lại trước khi gửi."
                : "Vui lòng đăng nhập để tạo booking cho phòng này.";
        }

        if (useSessionButtonElement) {
            useSessionButtonElement.disabled = !isLoggedIn;
            useSessionButtonElement.style.display = isLoggedIn ? "inline-flex" : "none";
        }

        if (loginLinkElement) {
            loginLinkElement.href = loginUrl;
            loginLinkElement.style.display = isLoggedIn ? "none" : "inline-flex";
        }

        submitButtonElement.innerHTML = isLoggedIn
            ? "<i class=\"fa fa-check mr-2\"></i> Gửi yêu cầu đặt phòng"
            : "<i class=\"fa fa-sign-in mr-2\"></i> Đăng nhập để đặt phòng";

        if (!isLoggedIn) {
            setState("Vui lòng đăng nhập trước khi tạo booking.", true);
        }
    }

    function renderSummary() {
        if (summaryNameElement) {
            summaryNameElement.textContent = state.roomName || `Phong #${state.roomId || "--"}`;
        }

        if (summaryPriceElement) {
            summaryPriceElement.innerHTML = `${escapeHtml(formatPrice(state.price))}<span>/đêm</span>`;
        }

        if (summaryIdElement) {
            summaryIdElement.textContent = state.roomId ? `#${state.roomId}` : "#--";
        }

        if (summaryTypeElement) {
            summaryTypeElement.textContent = state.roomTypeId || "--";
        }

        if (summaryDatesElement) {
            summaryDatesElement.textContent = `${formatDisplayDate(state.dateStart)} - ${formatDisplayDate(state.dateEnd)}`;
        }

        if (summaryStatusElement) {
            summaryStatusElement.textContent = state.roomStatusId || "--";
        }

        if (summaryDescriptionElement) {
            summaryDescriptionElement.textContent = state.roomName
                ? `${state.roomName} đã được chọn sẵn. Kiểm tra lại thông tin khách đặt trước khi gửi booking.`
                : "Màn hình này sẽ dùng dữ liệu phòng từ API để bạn xác nhận trước khi gửi yêu cầu đặt phòng.";
        }

        if (imageElement) {
            imageElement.src = getImagePath(state.roomId);
            imageElement.alt = state.roomName || "Xem trước phòng";
        }

        syncBookingAvailability();
    }

    function syncStayDates() {
        const todayIsoDate = getTodayIsoDate();
        const dateStartValue = String(fields.dateStart?.value || "").trim();
        const dateEndValue = String(fields.dateEnd?.value || "").trim();

        state.dateStart = dateStartValue;
        state.dateEnd = dateEndValue;

        if (fields.dateStart) {
            fields.dateStart.min = todayIsoDate;
        }

        if (fields.dateEnd) {
            fields.dateEnd.min = dateStartValue || todayIsoDate;
        }

        if (fields.dateStart && dateEndValue) {
            fields.dateStart.max = dateEndValue;
        } else if (fields.dateStart) {
            fields.dateStart.removeAttribute("max");
        }

        if (dateStartValue && dateStartValue < todayIsoDate) {
            fields.dateStart.value = "";
            state.dateStart = "";

            if (dateEndValue && fields.dateEnd) {
                fields.dateEnd.min = todayIsoDate;
            }

            const message = "Ngày nhận phòng không được nhỏ hơn ngày hiện tại.";
            notify("warning", message, "booking-room-date-start");
            setState(message, true);
            renderSummary();
            return;
        }

        if (dateStartValue && dateEndValue && dateEndValue < dateStartValue) {
            fields.dateEnd.value = dateStartValue;
            state.dateEnd = dateStartValue;
        }

        renderSummary();
    }

    async function loadRoomDetail() {
        if (!state.roomId) {
            setState("Không tìm thấy mã phòng trong đường dẫn.", true);
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/room/${encodeURIComponent(String(state.roomId))}`);
            const data = await parseJsonResponse(response);
            if (!response.ok) {
                throw new Error(data?.message || data?.Message || "Không thể tải thông tin phòng.");
            }

            const room = data?.resultObj ?? data?.ResultObj;
            if (!room) {
                throw new Error("Không tìm thấy thông tin phòng.");
            }

            state.roomName = room?.roomName ?? room?.RoomName ?? state.roomName;
            state.roomTypeId = room?.roomTypeId ?? room?.RoomTypeId ?? state.roomTypeId;
            state.roomStatusId = room?.roomStatusId ?? room?.RoomStatusId ?? state.roomStatusId;
            state.price = room?.price ?? room?.Price ?? state.price;
            state.roomName = String(state.roomName || "").trim();
            state.roomTypeId = String(state.roomTypeId || "").trim();
            state.roomStatusId = String(state.roomStatusId || "").trim();
            renderSummary();
        } catch (error) {
            setState(error?.message || "Không thể tải thông tin phòng.", true);
        }
    }

    function initializeFromQuery() {
        const query = new URLSearchParams(window.location.search);
        state.roomId = Number.parseInt(String(query.get("roomId") || ""), 10) || 0;
        state.roomName = String(query.get("roomName") || "").trim();
        state.roomTypeId = String(query.get("roomTypeId") || "").trim();
        state.price = query.get("price");
        state.dateStart = String(query.get("dateStart") || "").trim();
        state.dateEnd = String(query.get("dateEnd") || "").trim();

        if (fields.dateStart) {
            fields.dateStart.value = state.dateStart;
        }

        if (fields.dateEnd) {
            fields.dateEnd.value = state.dateEnd;
        }

        syncStayDates();
    }

    function buildPayload() {
        syncStayDates();

        return {
            FullName: String(fields.fullName.value || "").trim(),
            Identify: String(fields.identify.value || "").trim() || null,
            Phone: String(fields.phone.value || "").trim() || null,
            Mail: String(fields.mail.value || "").trim() || null,
            Dob: String(fields.dob.value || "").trim() || null,
            RoomId: state.roomId,
            DateStart: state.dateStart,
            DateEnd: state.dateEnd,
            Deposit: String(fields.deposit.value || "").trim() ? Number(fields.deposit.value) : null,
            VoucherId: String(fields.voucherId.value || "").trim() ? Number.parseInt(fields.voucherId.value, 10) : null
        };
    }

    function validatePayload(payload) {
        if (!payload.FullName) {
            return "Vui lòng nhập họ và tên.";
        }

        if (!payload.RoomId) {
            return "Không xác định được phòng cần đặt.";
        }

        if (!isRoomAvailable()) {
            return `Phòng hiện tại có trạng thái ${state.roomStatusId || "--"} nên không thể đặt.`;
        }

        if (!payload.DateStart || !payload.DateEnd) {
            return "Không đủ thông tin ngày nhận và ngày trả phòng.";
        }

        if (payload.DateStart < getTodayIsoDate()) {
            return "Ngày nhận phòng không được nhỏ hơn ngày hiện tại.";
        }

        if (payload.DateEnd < payload.DateStart) {
            return "Ngày trả phòng phải lớn hơn hoặc bằng ngày nhận phòng.";
        }

        const dobValidationMessage = validateDobValue(payload.Dob);
        if (dobValidationMessage) {
            return dobValidationMessage;
        }

        return "";
    }

    async function submitBooking() {
        if (!getAuthSession()?.accessToken) {
            redirectToLogin("Vui lòng đăng nhập trước khi tạo booking.");
            return;
        }

        const payload = buildPayload();
        const validationMessage = validatePayload(payload);
        if (validationMessage) {
            notify("warning", validationMessage, validationMessage === validateDobValue(payload.Dob) ? "booking-room-dob" : "booking-room-submit");
            setState(validationMessage, true);
            return;
        }

        submitButtonElement.disabled = true;
        setState("Đang gửi yêu cầu đặt phòng...", false);

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/booking`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await parseJsonResponse(response);
            const statusCode = Number(data?.statusCode ?? data?.StatusCode ?? response.status);

            if (!response.ok || statusCode >= 400) {
                if (response.status === 401 || statusCode === 401) {
                    redirectToLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục đặt phòng.");
                    return;
                }

                throw new Error(data?.message || data?.Message || "Không thể tạo đặt phòng.");
            }

            const result = data?.resultObj ?? data?.ResultObj ?? {};
            const bookingId = result?.bookingId ?? result?.BookingId ?? "";
            const guestAccessToken = String(result?.guestAccessToken ?? result?.GuestAccessToken ?? "").trim();
            const successMessage = data?.message || data?.Message || "Đặt phòng thành công.";
            const isLoggedIn = Boolean(getAuthSession()?.accessToken);
            const redirectQuery = new URLSearchParams();
            if (bookingId) {
                redirectQuery.set("bookingId", String(bookingId));
            }

            if (guestAccessToken) {
                redirectQuery.set("accessToken", guestAccessToken);
            }

            const redirectUrl = bookingId
                ? `/Payment/Checkout?${redirectQuery.toString()}`
                : "/";
            const stateMessage = bookingId
                ? `Đặt phòng thành công. Mã booking: #${bookingId}${isLoggedIn ? "" : ". Đang chuyển sang trang thanh toán cho khách vãng lai."}`
                : successMessage;

            notify("success", successMessage, "booking-room-success");
            setState(stateMessage, false);
            window.setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1200);
        } catch (error) {
            const message = error?.message || "Không thể tạo đặt phòng.";
            notify("error", message, "booking-room-error");
            setState(message, true);
        } finally {
            submitButtonElement.disabled = false;
        }
    }

    if (useSessionButtonElement) {
        useSessionButtonElement.addEventListener("click", populateFromSession);
    }

    if (fields.dateStart) {
        fields.dateStart.addEventListener("input", syncStayDates);
        fields.dateStart.addEventListener("change", syncStayDates);
        fields.dateStart.addEventListener("blur", syncStayDates);
    }

    if (fields.dateEnd) {
        fields.dateEnd.addEventListener("input", syncStayDates);
        fields.dateEnd.addEventListener("change", syncStayDates);
        fields.dateEnd.addEventListener("blur", syncStayDates);
    }

    if (fields.dob) {
        ["change", "blur"].forEach(eventName => {
            fields.dob.addEventListener(eventName, notifyDobValidation);
        });
    }

    formElement.addEventListener("submit", event => {
        event.preventDefault();
        submitBooking();
    });

    initializeFromQuery();
    syncAuthState();
    loadRoomDetail();
})();
