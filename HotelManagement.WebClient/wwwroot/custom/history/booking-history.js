
(function (window, document) {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const form = document.getElementById("bookingHistoryFilterForm");
    const keywordInput = document.getElementById("historyKeyword");
    const sortSelect = document.getElementById("historySort");
    const summary = document.getElementById("bookingHistorySummary");
    const customerMeta = document.getElementById("bookingHistoryCustomerMeta");
    const pagingMeta = document.getElementById("bookingHistoryPagingMeta");
    const tableBody = document.getElementById("bookingHistoryTableBody");
    const prevButton = document.getElementById("bookingHistoryPrevButton");
    const nextButton = document.getElementById("bookingHistoryNextButton");
    const searchButton = document.getElementById("bookingHistorySearchButton");

    if (!form || !tableBody || !prevButton || !nextButton || !searchButton) {
        return;
    }

    const state = {
        page: 1,
        itemsPerPage: 8,
        totalRows: 0,
        currentPage: 1,
        data: []
    };

    function getSession() {
        return window.webAppClientAuth?.getSession?.() || null;
    }

    function resolveUserId(session) {
        const directUserId = Number(session?.userId || 0);
        if (Number.isFinite(directUserId) && directUserId > 0) {
            return directUserId;
        }

        let jwtPayload = null;
        if (session?.accessToken) {
            try {
                const payload = String(session.accessToken).split(".")[1] || "";
                const normalizedPayload = payload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
                    .padEnd(Math.ceil(payload.length / 4) * 4, "=");
                jwtPayload = JSON.parse(atob(normalizedPayload));
            } catch (error) {
                jwtPayload = null;
            }
        }

        const tokenUserId = Number(jwtPayload?.user_id || jwtPayload?.userId || jwtPayload?.UserId || 0);
        return Number.isFinite(tokenUserId) && tokenUserId > 0 ? tokenUserId : 0;
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

    function formatCurrency(value) {
        if (value === null || value === undefined || value === "") {
            return "--";
        }

        const amount = Number(value);
        if (Number.isNaN(amount)) {
            return "--";
        }

        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(amount);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getStatusClass(status) {
        const normalized = String(status || "").trim().toLowerCase();
        if (normalized.includes("huy") || normalized.includes("cancel")) {
            return "history-status--cancelled";
        }
        if (normalized.includes("chưa thanh toán") || normalized.includes("chua thanh toan") || normalized.includes("pending") || normalized.includes("unpaid")) {
            return "history-status--pending";
        }
        if (normalized.includes("đã thanh toán") || normalized.includes("da thanh toan") || normalized.includes("paid") || normalized.includes("xac nhan") || normalized.includes("confirmed")) {
            return "history-status--confirmed";
        }
        return "history-status--default";
    }

    function setLoadingState(isLoading) {
        searchButton.disabled = isLoading;
        prevButton.disabled = isLoading || state.page <= 1;
        nextButton.disabled = isLoading;
    }

    function renderEmpty(message) {
        tableBody.innerHTML = `
            <div class="history-empty">${escapeHtml(message)}</div>
        `;
    }

    function renderRows(items) {
        if (!items.length) {
            renderEmpty("Không tìm thấy lịch sử đặt phòng phù hợp.");
            return;
        }

        tableBody.innerHTML = items.map(item => {
            const feedback = item.feedback || item.Feedback || "";
            const status = item.status || item.Status || "Đang xử lý";
            const bookingId = item.bookingId ?? item.BookingId ?? "--";
            const invoiceId = item.invoiceId ?? item.InvoiceId;
            const roomName = item.roomName || item.RoomName || "Đang cập nhật";
            const dateBooking = formatDate(item.dateBooking ?? item.DateBooking);
            const dateStart = formatDate(item.dateStart ?? item.DateStart);
            const dateEnd = formatDate(item.dateEnd ?? item.DateEnd);
            const deposit = formatCurrency(item.deposit ?? item.Deposit);
            const totalAmount = formatCurrency(item.totalAmount ?? item.TotalAmount);
            const normalizedStatus = String(status || "").trim().toLowerCase();
            const isCancelled = normalizedStatus.includes("hủy")
                || normalizedStatus.includes("huy")
                || normalizedStatus.includes("cancel");
            const isPaid = normalizedStatus.includes("đã thanh toán")
                || normalizedStatus.includes("da thanh toan")
                || normalizedStatus.includes("paid")
                || normalizedStatus.includes("confirmed");
            const canPay = !invoiceId
                && Number(bookingId) > 0
                && !isCancelled
                && !isPaid;
            const actionText = isCancelled
                ? "Booking đã hủy"
                : isPaid
                    ? "Đã có giao dịch"
                    : "Không thể thanh toán";
            const actionMarkup = canPay
                ? `<a class="history-action-link history-action-link--paynow" href="/Payment/Checkout?bookingId=${encodeURIComponent(String(bookingId))}&source=history">Thanh toán ngay</a>`
                : `<span class='history-action-text'>${escapeHtml(actionText)}</span>`;

            return `
                <article class="history-item">
                    <div>
                        <span class="history-booking-code">#${escapeHtml(bookingId)}</span>
                        <span class="history-room">${escapeHtml(roomName)}</span>
                        <span class="history-subtext">Invoice: ${escapeHtml(invoiceId ?? "--")} | Đặt ngày ${escapeHtml(dateBooking)}</span>
                        <span class="history-status ${getStatusClass(status)}">${escapeHtml(status)}</span>
                    </div>
                    <div class="history-stay">
                        <div class="history-stay__box">
                            <span class="history-label">Nhận phòng</span>
                            <span class="history-value">${escapeHtml(dateStart)}</span>
                        </div>
                        <div class="history-stay__box">
                            <span class="history-label">Trả phòng</span>
                            <span class="history-value">${escapeHtml(dateEnd)}</span>
                        </div>
                    </div>
                    <div class="history-money">
                        <div class="history-money__box">
                            <span class="history-label">Tổng tiền</span>
                            <span class="history-value">${escapeHtml(totalAmount)}</span>
                        </div>
                        <div class="history-money__box">
                            <span class="history-label">Đặt cọc</span>
                            <span class="history-value">${escapeHtml(deposit)}</span>
                        </div>
                    </div>
                    <div class="history-actions">
                        ${actionMarkup}
                        ${feedback ? `<span class="history-subtext">${escapeHtml(feedback)}</span>` : "<span class='history-subtext'>Chưa có phản hồi</span>"}
                    </div>
                </article>
            `;
        }).join("");
    }

    function updateMeta(items) {
        const first = items[0] || null;
        const totalRows = Number(state.totalRows || 0);
        const currentPage = Number(state.currentPage || state.page || 1);
        const totalPages = Math.max(1, Math.ceil(totalRows / state.itemsPerPage));

        summary.textContent = totalRows > 0
            ? `${totalRows} booking`
            : "0 booking";

        if (first) {
            const name = first.customerName || first.CustomerName || "Khách hàng";
            const mail = first.customerMail || first.CustomerMail || "--";
            const phone = first.customerPhone || first.CustomerPhone || "--";
            customerMeta.textContent = `${name} | ${mail} | ${phone}`;
        } else {
            const session = getSession();
            const userId = resolveUserId(session);
            customerMeta.textContent = userId > 0
                ? `User ID: ${userId}`
                : "Không có user ID để truy vấn.";
        }

        pagingMeta.textContent = `Trang ${currentPage}/${totalPages}`;
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages || totalRows === 0;
    }

    async function loadHistory() {
        const session = getSession();
        if (!session?.accessToken) {
            window.appNotifier?.redirectWithNotification("/Auth/Login", "Vui lòng đăng nhập để xem lịch sử.", "warning");
            return;
        }

        const userId = resolveUserId(session);

        if (!Number.isFinite(userId) || userId <= 0) {
            renderEmpty("Không có user ID trong phiên đăng nhập để truy vấn lịch sử.");
            summary.textContent = "Không thể tải lịch sử đặt phòng";
            customerMeta.textContent = "Session hiện tại không có user ID.";
            return;
        }

        setLoadingState(true);
        tableBody.innerHTML = `
            <div class="history-loading">Đang tải dữ liệu...</div>
        `;

        try {
            const sortValue = String(sortSelect.value || "DateBooking_desc");
            const [sortBy, sortDirection] = sortValue.split("_");
            const params = new URLSearchParams();
            params.set("Page", String(state.page));
            params.set("ItemsPerPage", String(state.itemsPerPage));
            params.set("SortBy", sortBy || "DateBooking");
            params.set("SortDesc", sortDirection !== "asc" ? "true" : "false");

            const keyword = String(keywordInput.value || "").trim();
            if (keyword) {
                params.set("Keyword", keyword);
            }

            params.set("UserId", String(userId));

            const response = await fetch(`${apiBaseUrl}/api/client/booking-history?${params.toString()}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${session.accessToken}`
                }
            });

            const payload = await response.json();
            const statusCode = Number(payload?.statusCode ?? payload?.StatusCode ?? response.status);
            const message = payload?.message || payload?.Message || "Không thể tải lịch sử đặt phòng.";
            const result = payload?.resultObj ?? payload?.ResultObj ?? null;

            if (!response.ok || statusCode >= 400 || !result) {
                throw new Error(message);
            }

            state.currentPage = Number(result.currentPage ?? result.CurrentPage ?? state.page);
            state.totalRows = Number(result.totalRows ?? result.TotalRows ?? 0);
            state.data = result.data ?? result.Data ?? [];

            renderRows(state.data);
            updateMeta(state.data);
        } catch (error) {
            summary.textContent = "Tải lịch sử thất bại";
            customerMeta.textContent = "Không thể kết nối đến hệ thống lịch sử.";
            renderEmpty(error?.message || "Không thể tải lịch sử đặt phòng.");
            prevButton.disabled = true;
            nextButton.disabled = true;
        } finally {
            setLoadingState(false);
            updateMeta(state.data);
        }
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        state.page = 1;
        loadHistory();
    });

    prevButton.addEventListener("click", () => {
        if (state.page <= 1) {
            return;
        }

        state.page -= 1;
        loadHistory();
    });

    nextButton.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil((state.totalRows || 0) / state.itemsPerPage));
        if (state.page >= totalPages) {
            return;
        }

        state.page += 1;
        loadHistory();
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadHistory, { once: true });
    } else {
        loadHistory();
    }
})(window, document);
