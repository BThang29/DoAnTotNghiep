(function (window, document) {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const stateElement = document.getElementById("paymentState");
    const formElement = document.getElementById("paymentCheckoutForm");
    const methodsContainer = document.getElementById("paymentMethodsContainer");
    const submitButton = document.getElementById("paymentSubmitButton");
    const cancelButton = document.getElementById("paymentCancelButton");
    const resultSection = document.getElementById("paymentResultSection");
    const accountNameInput = document.getElementById("paymentAccountName");
    const accountNumberInput = document.getElementById("paymentAccountNumber");
    const bankNameInput = document.getElementById("paymentBankName");
    const qrContentInput = document.getElementById("paymentQrContent");
    const noteInput = document.getElementById("paymentNote");
    const bookingIdElement = document.getElementById("paymentBookingId");
    const customerNameElement = document.getElementById("paymentCustomerName");
    const roomNameElement = document.getElementById("paymentRoomName");
    const roomPriceElement = document.getElementById("paymentRoomPrice");
    const stayDatesElement = document.getElementById("paymentStayDates");
    const depositElement = document.getElementById("paymentDeposit");
    const depositTotalElement = document.getElementById("paymentDepositTotal");
    const resultInvoiceIdElement = document.getElementById("paymentResultInvoiceId");
    const resultMethodElement = document.getElementById("paymentResultMethod");
    const resultTotalAmountElement = document.getElementById("paymentResultTotalAmount");
    const resultQrElement = document.getElementById("paymentResultQr");
    const resultNoteElement = document.getElementById("paymentResultNote");
    const countdownElement = document.getElementById("paymentCountdown");
    const countdownPanel = document.getElementById("paymentCountdownPanel");
    const timeoutModalElement = document.getElementById("paymentTimeoutModal");
    const cancelModalElement = document.getElementById("paymentCancelModal");
    const cancelModalDismissButton = document.getElementById("paymentCancelDismissButton");
    const cancelModalConfirmButton = document.getElementById("paymentCancelConfirmButton");

    if (!formElement || !methodsContainer || !submitButton || !stateElement) {
        return;
    }

    const state = {
        bookingId: 0,
        accessToken: "",
        checkoutSource: "",
        bookingStatus: 0,
        bookingExpireAt: 0,
        methods: [],
        selectedMethod: "",
        deadline: 0,
        countdownTimer: 0,
        isExpired: false,
        paymentCompleted: false,
        paymentAmountDue: 0
    };

    const holdDurationMs = 10 * 60 * 1000;

    function getSession() {
        return window.webAppClientAuth?.getSession?.() || null;
    }

    function getAuthHeaders() {
        const session = getSession();
        const headers = {
            "Content-Type": "application/json"
        };

        if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
        }

        if (state.accessToken) {
            headers["X-Booking-Access-Token"] = state.accessToken;
        }

        return headers;
    }

    function formatCurrency(value) {
        const amount = Number(value || 0);
        if (Number.isNaN(amount)) {
            return "--";
        }

        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(amount);
    }

    function formatDate(value) {
        if (!value) {
            return "--";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "--";
        }

        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(date);
    }

    function getNumber(value) {
        const amount = Number(value ?? 0);
        return Number.isFinite(amount) ? amount : 0;
    }

    function getStayNights(dateStartValue, dateEndValue) {
        const dateStart = new Date(dateStartValue);
        const dateEnd = new Date(dateEndValue);
        if (Number.isNaN(dateStart.getTime()) || Number.isNaN(dateEnd.getTime())) {
            return 1;
        }

        const startDateOnly = Date.UTC(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());
        const endDateOnly = Date.UTC(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate());
        const nights = Math.round((endDateOnly - startDateOnly) / (24 * 60 * 60 * 1000));
        return nights > 0 ? nights : 1;
    }

    function calculatePaymentAmountDue(booking) {
        const roomPrice = getNumber(booking.roomPrice ?? booking.RoomPrice);
        const deposit = getNumber(booking.deposit ?? booking.Deposit);
        const nights = getStayNights(booking.dateStart ?? booking.DateStart, booking.dateEnd ?? booking.DateEnd);
        const roomCharge = roomPrice * nights;

        return Math.max(0, roomCharge - deposit);
    }

    function isBookingCancelled() {
        return Number(state.bookingStatus) === -1;
    }

    function isBookingPaid() {
        return Number(state.bookingStatus) === 1;
    }

    function setState(message, isError) {
        stateElement.textContent = message;
        stateElement.classList.toggle("is-error", Boolean(isError));
    }

    function getDeadlineStorageKey() {
        return `telly-payment-deadline:${state.bookingId}`;
    }

    function getSavedDeadline() {
        const savedValue = Number.parseInt(String(window.sessionStorage.getItem(getDeadlineStorageKey()) || ""), 10);
        if (Number.isFinite(savedValue) && savedValue > 0) {
            return savedValue;
        }

        return 0;
    }

    function clearDeadline() {
        window.sessionStorage.removeItem(getDeadlineStorageKey());
    }

    function formatCountdown(milliseconds) {
        const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function setPaymentDisabled(disabled) {
        submitButton.disabled = disabled;
        if (cancelButton) {
            cancelButton.disabled = disabled;
        }
        accountNameInput.disabled = disabled;
        accountNumberInput.disabled = disabled;
        bankNameInput.disabled = disabled;
        qrContentInput.disabled = disabled;
        noteInput.disabled = disabled;
        methodsContainer
            .querySelectorAll("input[name='paymentMethod']")
            .forEach(input => {
                input.disabled = disabled;
            });
    }

    function showTimeoutModal() {
        if (!timeoutModalElement) {
            return;
        }

        timeoutModalElement.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function showCancelModal() {
        if (!cancelModalElement) {
            return;
        }

        cancelModalElement.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function hideCancelModal() {
        if (!cancelModalElement) {
            return;
        }

        cancelModalElement.hidden = true;
        if (timeoutModalElement?.hidden !== false) {
            document.body.style.overflow = "";
        }
    }

    function resolveBookingExpireTimestamp(value) {
        if (!value) {
            return 0;
        }

        const expireDate = new Date(value);
        if (Number.isNaN(expireDate.getTime())) {
            return 0;
        }

        return expireDate.getTime();
    }

    function initializeCountdown() {
        if (!countdownElement || !countdownPanel) {
            return;
        }

        window.clearInterval(state.countdownTimer);

        if (state.checkoutSource === "history" && state.bookingExpireAt > 0) {
            state.deadline = state.bookingExpireAt;
            clearDeadline();
        } else {
            const savedDeadline = getSavedDeadline();
            state.deadline = savedDeadline > 0 ? savedDeadline : Date.now() + holdDurationMs;
            window.sessionStorage.setItem(getDeadlineStorageKey(), String(state.deadline));
        }

        updateCountdown();
        state.countdownTimer = window.setInterval(updateCountdown, 1000);
    }

    async function updateCountdown() {
        if (!countdownElement || state.paymentCompleted || state.isExpired) {
            return;
        }

        const remaining = state.deadline - Date.now();
        countdownElement.textContent = formatCountdown(remaining);

        if (remaining <= 0) {
            await expireBooking();
        }
    }

    async function expireBooking() {
        if (state.isExpired || state.paymentCompleted) {
            return;
        }

        state.isExpired = true;
        window.clearInterval(state.countdownTimer);
        countdownElement.textContent = "00:00";
        countdownPanel.classList.add("is-expired");
        setPaymentDisabled(true);
        setState("Đã quá 10 phút thanh toán. Hệ thống đang hủy đặt phòng này...", true);

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/booking/${state.bookingId}/cancel-payment-timeout`, {
                method: "POST",
                headers: getAuthHeaders()
            });
            const body = await parseJsonResponse(response);
            if (!response.ok || Number(body?.statusCode ?? body?.StatusCode ?? response.status) >= 400) {
                throw new Error(body?.message || body?.Message || "Không thể hủy đặt phòng tự động.");
            }

            clearDeadline();
            setState(body?.message || body?.Message || "Phòng đã bị hủy do quá hạn thanh toán.", true);
            showTimeoutModal();
        } catch (error) {
            setState(error?.message || "Không thể hủy đặt phòng tự động.", true);
            window.appNotifier?.error?.(error?.message || "Không thể hủy đặt phòng tự động.");
        }
    }

    async function cancelBookingNow() {
        if (!state.bookingId) {
            setState("Không tìm thấy booking để hủy thanh toán.", true);
            return;
        }

        if (state.isExpired || isBookingCancelled()) {
            setState("Booking này đã bị hủy.", true);
            return;
        }

        if (state.paymentCompleted || isBookingPaid()) {
            setState("Booking này đã được thanh toán, không thể hủy.", true);
            return;
        }

        if (!window.confirm("Bạn chắc chắn muốn hủy thanh toán và hủy booking này ngay lập tức?")) {
            return;
        }

        setPaymentDisabled(true);
        setState("Đang hủy thanh toán và booking...", false);

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/booking/${state.bookingId}/cancel`, {
                method: "POST",
                headers: getAuthHeaders()
            });
            const body = await parseJsonResponse(response);
            if (!response.ok || Number(body?.statusCode ?? body?.StatusCode ?? response.status) >= 400) {
                throw new Error(body?.message || body?.Message || "Không thể hủy thanh toán ngay lúc này.");
            }

            state.isExpired = true;
            state.bookingStatus = -1;
            window.clearInterval(state.countdownTimer);
            clearDeadline();
            countdownElement.textContent = "00:00";
            countdownPanel.classList.add("is-expired");
            setState(body?.message || body?.Message || "Đặt phòng đã được hủy.", true);
            window.appNotifier?.success?.(body?.message || body?.Message || "Đặt phòng đã được hủy.");
            window.setTimeout(() => {
                window.location.href = "/BookingHistory/History";
            }, 1200);
        } catch (error) {
            setState(error?.message || "Không thể hủy thanh toán ngay lúc này.", true);
            window.appNotifier?.error?.(error?.message || "Không thể hủy thanh toán ngay lúc này.");
            if (!state.paymentCompleted && !state.isExpired) {
                setPaymentDisabled(false);
            }
        }
    }

    async function confirmCancelBookingNow() {
        if (!state.bookingId) {
            setState("Khong tim thay booking de huy thanh toan.", true);
            return;
        }

        if (state.isExpired || isBookingCancelled()) {
            hideCancelModal();
            setState("Booking nay da bi huy.", true);
            return;
        }

        if (state.paymentCompleted || isBookingPaid()) {
            hideCancelModal();
            setState("Booking nay da duoc thanh toan, khong the huy.", true);
            return;
        }

        hideCancelModal();
        setPaymentDisabled(true);
        setState("Dang huy thanh toan va booking...", false);

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/booking/${state.bookingId}/cancel`, {
                method: "POST",
                headers: getAuthHeaders()
            });
            const body = await parseJsonResponse(response);
            if (!response.ok || Number(body?.statusCode ?? body?.StatusCode ?? response.status) >= 400) {
                throw new Error(body?.message || body?.Message || "Khong the huy thanh toan ngay luc nay.");
            }

            state.isExpired = true;
            state.bookingStatus = -1;
            window.clearInterval(state.countdownTimer);
            clearDeadline();
            countdownElement.textContent = "00:00";
            countdownPanel.classList.add("is-expired");
            setState(body?.message || body?.Message || "Dat phong da duoc huy.", true);
            window.appNotifier?.success?.(body?.message || body?.Message || "Dat phong da duoc huy.");
            window.setTimeout(() => {
                window.location.href = "/BookingHistory/History";
            }, 1200);
        } catch (error) {
            setState(error?.message || "Khong the huy thanh toan ngay luc nay.", true);
            window.appNotifier?.error?.(error?.message || "Khong the huy thanh toan ngay luc nay.");
            if (!state.paymentCompleted && !state.isExpired) {
                setPaymentDisabled(false);
            }
        }
    }

    function parseJsonResponse(response) {
        return response.text().then(rawText => {
            if (!rawText) {
                return null;
            }

            try {
                return JSON.parse(rawText);
            } catch (error) {
                return null;
            }
        });
    }

    function normalizeMethod(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function getMethodKind(value, name) {
        const methodText = `${normalizeMethod(value)} ${normalizeMethod(name)}`;
        if (methodText.includes("cash") || methodText.includes("tien mat")) {
            return "cash";
        }

        if (methodText.includes("banktransfer") || methodText.includes("chuyen khoan")) {
            return "bank";
        }

        if (methodText.includes("momo")) {
            return "momo";
        }

        return "other";
    }

    function syncMethodFields() {
        if (state.isExpired || state.paymentCompleted) {
            setPaymentDisabled(true);
            return;
        }

        const selectedMethod = state.methods.find(method => String(method?.value ?? method?.Value ?? "") === state.selectedMethod);
        const selectedMethodKind = getMethodKind(state.selectedMethod, selectedMethod?.name ?? selectedMethod?.Name ?? "");
        const requiresTransferFields = selectedMethodKind === "bank" || selectedMethodKind === "momo";
        formElement.classList.toggle("is-cash", !requiresTransferFields);
        accountNameInput.disabled = !requiresTransferFields;
        accountNumberInput.disabled = !requiresTransferFields;
        bankNameInput.disabled = !requiresTransferFields;
        qrContentInput.disabled = !requiresTransferFields;

        if (!requiresTransferFields) {
            accountNameInput.value = "";
            accountNumberInput.value = "";
            bankNameInput.value = "";
            qrContentInput.value = "";
        }
    }

    function renderMethods() {
        if (!state.methods.length) {
            methodsContainer.innerHTML = "<div class='payment-text'>Không có phương thức thanh toán khả dụng.</div>";
            return;
        }

        methodsContainer.innerHTML = state.methods.map(method => {
            const value = String(method?.value ?? method?.Value ?? "");
            const name = String(method?.name ?? method?.Name ?? value);
            const isSelected = value === state.selectedMethod;
            const methodKind = getMethodKind(value, name);
            const isCash = methodKind === "cash";
            const isBank = methodKind === "bank";
            const isMomo = methodKind === "momo";
            const description = isCash
                ? "Thanh toán trực tiếp tại quầy lễ tân."
                : isBank
                    ? "Chuyển khoản ngân hàng theo mã booking."
                    : "Thanh toán nhanh qua ví Momo hoặc mã QR.";
            const logoClass = isCash
                ? "payment-method__icon--cash"
                : isBank
                    ? "payment-method__icon--bank"
                    : "payment-method__icon--momo";
            const logoIcon = isCash
                ? "fa-money"
                : isBank
                    ? "fa-university"
                    : isMomo ? "fa-mobile" : "fa-credit-card";
            const displayName = isCash
                ? "Tiền mặt"
                : isBank
                    ? "Chuyển khoản"
                    : isMomo ? "Momo" : name;

            return `
                <label class="payment-method${isSelected ? " is-selected" : ""}">
                    <input type="radio" name="paymentMethod" value="${value}" ${isSelected ? "checked" : ""} ${state.isExpired ? "disabled" : ""}>
                    <div class="payment-method__body">
                        <span class="payment-method__icon ${logoClass}"><i class="fa ${logoIcon}"></i></span>
                        <span>
                            <span class="payment-method__name">${displayName}</span>
                            <span class="payment-method__text">${description}</span>
                        </span>
                    </div>
                </label>`;
        }).join("");
    }

    function bindMethodEvents() {
        methodsContainer.addEventListener("change", event => {
            const input = event.target.closest("input[name='paymentMethod']");
            if (!input) {
                return;
            }

            state.selectedMethod = String(input.value || "");
            renderMethods();
            syncMethodFields();
        });
    }

    async function loadBookingDetail() {
        const response = await fetch(`${apiBaseUrl}/api/client/booking/${state.bookingId}`, {
            headers: getAuthHeaders()
        });
        const payload = await parseJsonResponse(response);
        const result = payload?.resultObj ?? payload?.ResultObj ?? null;
        if (!response.ok || Number(payload?.statusCode ?? payload?.StatusCode ?? response.status) >= 400 || !result) {
            throw new Error(payload?.message || payload?.Message || "Không thể tải thông tin booking.");
        }

        const dateStart = result.dateStart ?? result.DateStart;
        const dateEnd = result.dateEnd ?? result.DateEnd;
        const roomPrice = result.roomPrice ?? result.RoomPrice;
        const deposit = result.deposit ?? result.Deposit;
        const bookingExpire = result.bookingExpire ?? result.BookingExpire;
        state.bookingStatus = Number(result.bookingStatus ?? result.BookingStatus ?? 0);
        state.bookingExpireAt = resolveBookingExpireTimestamp(bookingExpire);
        const paymentAmountDue = calculatePaymentAmountDue(result);
        state.paymentAmountDue = paymentAmountDue;

        bookingIdElement.textContent = `#${result.id ?? result.Id ?? result.bookingId ?? result.BookingId ?? state.bookingId}`;
        customerNameElement.textContent = result.customerName ?? result.CustomerName ?? "--";
        roomNameElement.textContent = result.roomName ?? result.RoomName ?? "--";
        roomPriceElement.textContent = formatCurrency(roomPrice);
        stayDatesElement.textContent = `${formatDate(dateStart)} - ${formatDate(dateEnd)}`;
        depositElement.textContent = formatCurrency(deposit);
        if (depositTotalElement) {
            depositTotalElement.textContent = formatCurrency(paymentAmountDue);
        }

        if (isBookingCancelled()) {
            state.isExpired = true;
            setPaymentDisabled(true);
            setState("Booking này đã bị hủy, không thể tiếp tục thanh toán.", true);
            showTimeoutModal();
            return;
        }

        if (isBookingPaid()) {
            state.paymentCompleted = true;
            window.clearInterval(state.countdownTimer);
            clearDeadline();
            setPaymentDisabled(true);
            setState("Booking này đã được thanh toán.", false);
        }
    }

    async function loadPaymentMethods() {
        const response = await fetch(`${apiBaseUrl}/api/client/payment/methods`, {
            headers: getAuthHeaders()
        });
        const payload = await parseJsonResponse(response);
        const result = payload?.resultObj ?? payload?.ResultObj ?? [];
        if (!response.ok || Number(payload?.statusCode ?? payload?.StatusCode ?? response.status) >= 400) {
            throw new Error(payload?.message || payload?.Message || "Không thể tải phương thức thanh toán.");
        }

        state.methods = Array.isArray(result) ? result : [];
        state.selectedMethod = String(state.methods[0]?.value ?? state.methods[0]?.Value ?? "");
        renderMethods();
        syncMethodFields();
    }

    function buildPayload() {
        return {
            BookingId: state.bookingId,
            Method: state.selectedMethod,
            AccountName: String(accountNameInput.value || "").trim() || null,
            AccountNumber: String(accountNumberInput.value || "").trim() || null,
            BankName: String(bankNameInput.value || "").trim() || null,
            QrContent: String(qrContentInput.value || "").trim() || null,
            Note: String(noteInput.value || "").trim() || null,
            BookingAccessToken: state.accessToken || null
        };
    }

    function validatePayload(payload) {
        if (!state.bookingId) {
            return "Không tìm thấy booking để thanh toán.";
        }

        if (state.isExpired) {
            return "Đặt phòng đã hết thời gian giữ chỗ.";
        }

        if (isBookingCancelled()) {
            return "Booking này đã bị hủy.";
        }

        if (isBookingPaid()) {
            return "Booking này đã được thanh toán.";
        }

        if (!payload.Method) {
            return "Vui lòng chọn phương thức thanh toán.";
        }

        const selectedMethod = state.methods.find(method => String(method?.value ?? method?.Value ?? "") === payload.Method);
        const methodKind = getMethodKind(payload.Method, selectedMethod?.name ?? selectedMethod?.Name ?? "");
        if ((methodKind === "bank" || methodKind === "momo")
            && (!payload.AccountNumber || !payload.BankName || !payload.QrContent)) {
            return "Vui lòng nhập đủ thông tin thanh toán cho phương thức đã chọn.";
        }

        return "";
    }

    function renderResult(result) {
        resultSection.hidden = false;
        resultInvoiceIdElement.textContent = `#${result.invoiceId ?? result.InvoiceId ?? "--"}`;
        resultMethodElement.textContent = result.method ?? result.Method ?? "--";
        const displayAmount = Number.isFinite(state.paymentAmountDue)
            ? state.paymentAmountDue
            : (result.totalAmount ?? result.TotalAmount);
        resultTotalAmountElement.textContent = formatCurrency(displayAmount);
        resultQrElement.textContent = result.qrContent ?? result.QrContent ?? "--";
        resultNoteElement.textContent = result.note ?? result.Note ?? "--";
    }

    async function submitPayment(event) {
        event.preventDefault();

        const payload = buildPayload();
        const validationMessage = validatePayload(payload);
        if (validationMessage) {
            setState(validationMessage, true);
            window.appNotifier?.warning(validationMessage);
            return;
        }

        submitButton.disabled = true;
        setState("Đang tạo giao dịch thanh toán...", false);

        try {
            const response = await fetch(`${apiBaseUrl}/api/client/payment/online`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const body = await parseJsonResponse(response);
            const result = body?.resultObj ?? body?.ResultObj ?? null;
            if (!response.ok || Number(body?.statusCode ?? body?.StatusCode ?? response.status) >= 400 || !result) {
                throw new Error(body?.message || body?.Message || "Không thể tạo giao dịch thanh toán.");
            }

            state.paymentCompleted = true;
            window.clearInterval(state.countdownTimer);
            clearDeadline();
            setPaymentDisabled(true);
            setState(body?.message || body?.Message || "Đã tạo giao dịch thanh toán.", false);
            renderResult(result);
            window.appNotifier?.success?.(body?.message || body?.Message || "Thanh toán thành công.");
        } catch (error) {
            setState(error?.message || "Không thể tạo giao dịch thanh toán.", true);
            window.appNotifier?.error(error?.message || "Không thể tạo giao dịch thanh toán.");
            if (!state.isExpired && !state.paymentCompleted) {
                submitButton.disabled = false;
            }
        } finally {
            if (!state.isExpired && !state.paymentCompleted) {
                submitButton.disabled = false;
            }
        }
    }

    function initializeBookingId() {
        const query = new URLSearchParams(window.location.search);
        state.bookingId = Number.parseInt(String(query.get("bookingId") || ""), 10) || 0;
        state.accessToken = String(query.get("accessToken") || "").trim();
        state.checkoutSource = String(query.get("source") || "").trim().toLowerCase();
    }

    async function initialize() {
        initializeBookingId();
        const session = getSession();
        if (!session?.accessToken && !state.accessToken) {
            setState("Không có quyền truy cập booking này. Vui lòng đăng nhập hoặc dùng liên kết thanh toán hợp lệ.", true);
            return;
        }
        if (!state.bookingId) {
            setState("Không tìm thấy booking để thanh toán.", true);
            return;
        }

        try {
            await Promise.all([
                loadBookingDetail(),
                loadPaymentMethods()
            ]);
            if (!state.paymentCompleted && !state.isExpired) {
                initializeCountdown();
            }
            if (!state.isExpired) {
                setState("Kiểm tra lại thông tin và xác nhận thanh toán.", false);
            }
        } catch (error) {
            setState(error?.message || "Không thể khởi tạo màn hình thanh toán.", true);
        }
    }

    bindMethodEvents();
    formElement.addEventListener("submit", submitPayment);
    cancelButton?.addEventListener("click", showCancelModal);
    cancelModalDismissButton?.addEventListener("click", hideCancelModal);
    cancelModalConfirmButton?.addEventListener("click", confirmCancelBookingNow);
    cancelModalElement?.addEventListener("click", event => {
        if (event.target === cancelModalElement) {
            hideCancelModal();
        }
    });
    initialize();
})(window, document);
