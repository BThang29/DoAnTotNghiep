(() => {
    "use strict";

    const page = window.customerReviewPage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.historyList = document.getElementById("reviewHistoryList");

    if (!page.elements.historyList) {
        return;
    }

    page.renderReviewStats = function renderReviewStats(items) {
        const reviews = Array.isArray(items) ? items : [];
        const count = reviews.length;
        const totalRating = reviews.reduce((sum, item) => sum + (Number(item?.rating ?? item?.Rating) || 0), 0);
        const average = count > 0 ? (totalRating / count).toFixed(1) : "0.0";
        const latest = reviews.length > 0
            ? reviews
                .map(item => item?.createdAt ?? item?.CreatedAt)
                .filter(Boolean)
                .sort((a, b) => new Date(b) - new Date(a))[0]
            : null;

        page.elements.reviewCount.textContent = String(count);
        page.elements.reviewAverageRating.textContent = average;
        page.elements.reviewLatestDate.textContent = page.formatDate(latest);
        page.elements.historySummary.textContent = count > 0 ? `${count} review của phòng đang chọn` : "Phòng này chưa có review.";
    };

    page.renderHistoryRows = function renderHistoryRows(items) {
        const reviews = Array.isArray(items) ? items : [];
        page.renderReviewStats(reviews);

        if (reviews.length === 0) {
            page.elements.historyList.innerHTML = `<div class="text-center text-muted py-5">Phòng này chưa có lịch sử review.</div>`;
            return;
        }

        page.elements.historyList.innerHTML = reviews.map(item => {
            const bookingId = item?.bookingId ?? item?.BookingId ?? "";
            const customerName = item?.customerName ?? item?.CustomerName ?? "";
            const customerPhone = item?.customerPhone ?? item?.CustomerPhone ?? "";
            const feedback = item?.feedback ?? item?.Feedback ?? "";
            const rating = item?.rating ?? item?.Rating ?? 0;
            const createdAt = item?.createdAt ?? item?.CreatedAt ?? "";
            const updatedAt = item?.updatedAt ?? item?.UpdatedAt ?? "";

            return `
                <div class="review-history-item">
                    <div class="review-history-item-header">
                        <div>
                            <div class="review-history-item-title">Booking #${bookingId} | ${page.formatValue(customerName)}</div>
                            <div class="review-history-item-meta">
                                <div>SDT: ${page.formatValue(customerPhone)}</div>
                                <div>Ngày tạo: ${page.formatDate(createdAt)}</div>
                                <div>Cap nhat: ${page.formatDate(updatedAt)}</div>
                            </div>
                        </div>
                        <div class="review-rating-badge">
                            <i class="fas fa-star"></i>
                            <span>${rating}/5</span>
                        </div>
                    </div>
                    <div class="review-history-item-feedback">${page.formatValue(feedback)}</div>
                </div>`;
        }).join("");
    };

    page.loadReviewHistory = async function loadReviewHistory(roomId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.elements.historyList.innerHTML = `<div class="text-center text-muted py-5">Dang tai lich su review...</div>`;
        page.elements.historySummary.textContent = "Dang tai review...";
        page.elements.reviewCount.textContent = "0";
        page.elements.reviewAverageRating.textContent = "0.0";
        page.elements.reviewLatestDate.textContent = "-";

        try {
            const response = await apiClient.Get(`${page.reviewApiUrl}?page=1&itemsPerPage=100&roomId=${roomId}&sortBy=createdAt&sortDesc=true`);
            const result = page.getResultObject(response);
            const items = result?.data ?? result?.Data ?? [];
            page.renderHistoryRows(items);
        } catch (error) {
            console.error("Load review history failed:", error);
            page.elements.historyList.innerHTML = `<div class="text-center text-danger py-5">Không thể tải lịch sử review.</div>`;
            page.elements.historySummary.textContent = "Tai review that bai";
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải lịch sử review.");
        }
    };
})();
