(() => {
    "use strict";

    const page = {
        paymentApiUrl: window.appUrl("/api/admin/payment"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("paymentQrKeyword"),
            methodFilter: document.getElementById("paymentQrMethodFilter"),
            itemsPerPage: document.getElementById("paymentQrItemsPerPage"),
            searchButton: document.getElementById("paymentQrSearchButton"),
            summary: document.getElementById("paymentQrSummary"),
            paginationInfo: document.getElementById("paymentQrPaginationInfo"),
            tableBody: document.getElementById("paymentQrTableBody"),
            pagination: document.getElementById("paymentQrPagination"),
            selectedTitle: document.getElementById("paymentQrSelectedTitle"),
            selectedMeta: document.getElementById("paymentQrSelectedMeta"),
            detailId: document.getElementById("paymentQrDetailId"),
            detailMethod: document.getElementById("paymentQrDetailMethod"),
            detailAccountNumber: document.getElementById("paymentQrDetailAccountNumber"),
            detailStatus: document.getElementById("paymentQrDetailStatus"),
            qrImage: document.getElementById("paymentQrImage"),
            qrEmptyState: document.getElementById("paymentQrEmptyState"),
            qrContent: document.getElementById("paymentQrContent"),
            statusText: document.getElementById("paymentQrStatusText"),
            copyButton: document.getElementById("paymentQrCopyButton"),
            openImageButton: document.getElementById("paymentQrOpenImageButton")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("paymentQrItemsPerPage")?.value) || 10,
            keyword: "",
            method: "",
            totalRows: 0,
            methods: [],
            payments: [],
            selectedPaymentId: null
        }
    };

    if (!window.apiClient || Object.values(page.elements).some(element => !element)) {
        return;
    }

    page.ensureAuthenticated = function ensureAuthenticated() {
        const token = apiClient.getToken();
        if (token) {
            return true;
        }

        page.notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
        return false;
    };

    page.getResultObject = function getResultObject(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response?.Data
            || response;
    };

    page.formatValue = function formatValue(value) {
        return value === null || value === undefined || value === "" ? "-" : value;
    };

    page.formatMethod = function formatMethod(method) {
        const normalized = (method || "").toLowerCase();
        if (normalized === "cash") {
            return "Tiền mặt";
        }

        if (normalized === "banktransfer") {
            return "Chuyển khoản";
        }

        if (normalized === "momo") {
            return "Momo";
        }

        return page.formatValue(method);
    };

    page.isQrMethod = function isQrMethod(method) {
        const normalized = String(method || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "")
            .toLowerCase();

        return normalized === "banktransfer" || normalized === "chuyenkhoan" || normalized === "momo";
    };

    page.buildQrContent = function buildQrContent(method, qrContent, accountNumber, bankName, accountName) {
        const normalizedMethod = String(method || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "")
            .toLowerCase();

        const existingQrContent = String(qrContent || "").trim();
        if (existingQrContent) {
            return existingQrContent;
        }

        if (normalizedMethod !== "banktransfer" && normalizedMethod !== "chuyenkhoan" && normalizedMethod !== "momo") {
            return "";
        }

        const normalizedAccountNumber = String(accountNumber || "").trim();
        const normalizedBankName = String(bankName || "").trim();
        const normalizedAccountName = String(accountName || "").trim();

        if (!normalizedAccountNumber || !normalizedBankName) {
            return "";
        }

        return `BANK:${normalizedBankName}|ACCOUNT:${normalizedAccountNumber}|NAME:${normalizedAccountName}`;
    };

    page.buildQueryString = function buildQueryString() {
        const params = new URLSearchParams({
            page: String(page.state.page),
            itemsPerPage: String(page.state.itemsPerPage),
            keyword: page.state.keyword,
            method: page.state.method,
            sortBy: "id",
            sortDesc: "true"
        });

        return params.toString();
    };

    page.createPaginationItem = function createPaginationItem(label, currentPage, disabled, active) {
        return `
            <li class="page-item${disabled ? " disabled" : ""}${active ? " active" : ""}">
                <button type="button" class="page-link" data-page="${currentPage}" ${disabled ? "disabled" : ""}>${label}</button>
            </li>`;
    };

    page.renderPagination = function renderPagination(totalRows) {
        page.state.totalRows = Number(totalRows) || 0;
        const totalPages = Math.max(1, Math.ceil(page.state.totalRows / page.state.itemsPerPage));
        const startItem = page.state.totalRows === 0 ? 0 : ((page.state.page - 1) * page.state.itemsPerPage) + 1;
        const endItem = page.state.totalRows === 0 ? 0 : Math.min(page.state.page * page.state.itemsPerPage, page.state.totalRows);

        page.elements.summary.textContent = `Tổng ${page.state.totalRows} cấu hình thanh toán`;
        page.elements.paginationInfo.textContent = `Hiển thị ${startItem}-${endItem} trên ${page.state.totalRows}`;

        const items = [page.createPaginationItem("Previous", page.state.page - 1, page.state.page <= 1, false)];
        for (let currentPage = 1; currentPage <= totalPages; currentPage += 1) {
            if (currentPage === 1 || currentPage === totalPages || Math.abs(currentPage - page.state.page) <= 1) {
                items.push(page.createPaginationItem(String(currentPage), currentPage, false, currentPage === page.state.page));
            }
        }

        items.push(page.createPaginationItem("Next", page.state.page + 1, page.state.page >= totalPages, false));
        page.elements.pagination.innerHTML = items.join("");
    };

    page.renderTableLoading = function renderTableLoading() {
        page.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
        page.elements.paginationInfo.textContent = "";
    };

    page.renderRows = function renderRows(items) {
        if (!Array.isArray(items) || items.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">Không có thanh toán phù hợp.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = items.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const method = item?.method ?? item?.Method ?? "";
            const accountName = item?.accountName ?? item?.AccountName ?? "-";
            const accountNumber = item?.accountNumber ?? item?.AccountNumber ?? "-";
            const bankName = item?.bankName ?? item?.BankName ?? "-";
            const isSelected = Number(id) === Number(page.state.selectedPaymentId);

            return `
                <tr class="${isSelected ? "table-primary" : ""}">
                    <td>
                        <div class="font-weight-bold text-gray-800">${page.formatMethod(method)}</div>
                        <div class="small text-muted">${page.formatValue(accountName)}</div>
                    </td>
                    <td>${page.formatValue(accountNumber)}</td>
                    <td>${page.formatValue(bankName)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-primary btn-sm" data-action="select" data-id="${id}">
                            Chọn
                        </button>
                    </td>
                </tr>`;
        }).join("");
    };

    page.resetDetail = function resetDetail() {
        page.state.selectedPaymentId = null;
        page.elements.selectedTitle.textContent = "Chưa chọn thanh toán";
        page.elements.selectedMeta.textContent = "Chọn một dòng từ danh sách bên trái để tải dữ liệu QR.";
        page.elements.detailId.textContent = "-";
        page.elements.detailMethod.textContent = "-";
        page.elements.detailAccountNumber.textContent = "-";
        page.elements.detailStatus.textContent = "-";
        page.elements.qrContent.value = "";
        page.elements.statusText.textContent = "Chọn thanh toán để xem QR.";
        page.elements.openImageButton.href = "#";
        page.elements.openImageButton.classList.add("disabled");
        page.elements.qrImage.src = "";
        page.elements.qrImage.classList.add("d-none");
        page.elements.qrEmptyState.classList.remove("d-none");
    };

    page.buildQrImageUrl = function buildQrImageUrl(content) {
        return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(content)}`;
    };

    page.populateMethodOptions = function populateMethodOptions() {
        const options = page.state.methods.map(method => `
            <option value="${method.value}">${method.name}</option>
        `).join("");
        page.elements.methodFilter.innerHTML = `<option value="">Tất cả</option>${options}`;
    };

    page.loadMethods = async function loadMethods() {
        const response = await apiClient.Get(`${page.paymentApiUrl}/methods`, { showLoading: false });
        const result = page.getResultObject(response);
        const methods = (result || []).map(item => ({
            value: item?.value ?? item?.Value ?? "",
            name: item?.name ?? item?.Name ?? ""
        })).filter(item => item.value);

        page.state.methods = methods;
        page.populateMethodOptions();
    };

    page.loadPayments = async function loadPayments() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderTableLoading();

        try {
            const response = await apiClient.Get(`${page.paymentApiUrl}?${page.buildQueryString()}`);
            const result = page.getResultObject(response);
            const items = result?.data ?? result?.Data ?? [];
            const totalRows = result?.totalRows ?? result?.TotalRows ?? items.length;
            const currentPage = result?.currentPage ?? result?.CurrentPage ?? page.state.page;

            page.state.payments = items;
            page.state.page = Number(currentPage) || page.state.page;

            page.renderRows(items);
            page.renderPagination(totalRows);
        } catch (error) {
            console.error("Load payment list for QR failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">Không thể tải danh sách thanh toán.</td>
                </tr>`;
            page.elements.summary.textContent = "Tải dữ liệu thất bại";
            page.elements.paginationInfo.textContent = "";
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách thanh toán.");
        }
    };

    page.loadQrDetail = async function loadQrDetail(paymentId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        const selectedPayment = page.state.payments.find(item => Number(item?.id ?? item?.Id) === Number(paymentId));
        page.state.selectedPaymentId = Number(paymentId);
        page.elements.selectedTitle.textContent = selectedPayment
            ? `${page.formatMethod(selectedPayment?.method ?? selectedPayment?.Method)} #${paymentId}`
            : `Thanh toán #${paymentId}`;
        page.elements.selectedMeta.textContent = "Đang tải dữ liệu QR...";
        page.elements.statusText.textContent = "Đang tải QR...";
        page.renderRows(page.state.payments);

        try {
            const response = await apiClient.Get(`${page.paymentApiUrl}/${paymentId}/qr`);
            const detail = page.getResultObject(response);
            const method = detail?.method ?? detail?.Method ?? "";
            const accountName = detail?.accountName ?? detail?.AccountName ?? "";
            const accountNumber = detail?.accountNumber ?? detail?.AccountNumber ?? "";
            const bankName = detail?.bankName ?? detail?.BankName ?? "";
            const qrContent = page.buildQrContent(
                method,
                detail?.qrContent ?? detail?.QrContent ?? "",
                accountNumber,
                bankName,
                accountName
            );
            const hasQr = page.isQrMethod(method) && !!qrContent;

            page.elements.selectedMeta.textContent = `${page.formatValue(accountNumber)} | ${page.formatMethod(method)}`;
            page.elements.detailId.textContent = `#${detail?.id ?? detail?.Id ?? "-"}`;
            page.elements.detailMethod.textContent = page.formatMethod(method);
            page.elements.detailAccountNumber.textContent = page.formatValue(accountNumber);
            page.elements.detailStatus.textContent = hasQr ? "Có QR" : "Không có QR";
            page.elements.qrContent.value = qrContent;

            if (hasQr) {
                const imageUrl = page.buildQrImageUrl(qrContent);
                page.elements.qrImage.src = imageUrl;
                page.elements.qrImage.classList.remove("d-none");
                page.elements.qrEmptyState.classList.add("d-none");
                page.elements.openImageButton.href = imageUrl;
                page.elements.openImageButton.classList.remove("disabled");
                page.elements.statusText.textContent = "Đã tải dữ liệu QR. Bạn có thể copy nội dung hoặc mở ảnh QR.";
            } else {
                page.elements.qrImage.src = "";
                page.elements.qrImage.classList.add("d-none");
                page.elements.qrEmptyState.classList.remove("d-none");
                page.elements.openImageButton.href = "#";
                page.elements.openImageButton.classList.add("disabled");
                page.elements.statusText.textContent = "Phương thức này không có QR hoặc chưa đủ dữ liệu QR.";
            }
        } catch (error) {
            console.error("Load payment QR failed:", error);
            page.resetDetail();
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải dữ liệu QR.");
        }
    };

    page.syncStateFromFilters = function syncStateFromFilters(resetPage) {
        page.state.keyword = page.elements.keyword.value.trim();
        page.state.method = page.elements.methodFilter.value || "";
        page.state.itemsPerPage = Number(page.elements.itemsPerPage.value) || 10;

        if (resetPage) {
            page.state.page = 1;
        }
    };

    page.copyQrContent = async function copyQrContent() {
        const value = page.elements.qrContent.value.trim();
        if (!value) {
            page.notifier?.warning("Không có nội dung QR để copy.");
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            page.notifier?.success("Đã copy nội dung QR.");
        } catch (error) {
            console.error("Copy QR content failed:", error);
            page.notifier?.error("Không thể copy nội dung QR.");
        }
    };

    page.bindEvents = function bindEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadPayments();
        });

        page.elements.itemsPerPage.addEventListener("change", () => {
            page.syncStateFromFilters(true);
            page.loadPayments();
        });

        page.elements.methodFilter.addEventListener("change", () => {
            page.syncStateFromFilters(true);
            page.loadPayments();
        });

        page.elements.keyword.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                page.syncStateFromFilters(true);
                page.loadPayments();
            }
        });

        page.elements.tableBody.addEventListener("click", event => {
            const button = event.target.closest("[data-action='select']");
            if (!button) {
                return;
            }

            const paymentId = Number(button.dataset.id);
            if (!paymentId) {
                return;
            }

            page.loadQrDetail(paymentId);
        });

        page.elements.pagination.addEventListener("click", event => {
            const button = event.target.closest("[data-page]");
            if (!button) {
                return;
            }

            const targetPage = Number(button.dataset.page);
            const totalPages = Math.max(1, Math.ceil(page.state.totalRows / page.state.itemsPerPage));
            if (Number.isNaN(targetPage) || targetPage < 1 || targetPage > totalPages || targetPage === page.state.page) {
                return;
            }

            page.state.page = targetPage;
            page.loadPayments();
        });

        page.elements.copyButton.addEventListener("click", page.copyQrContent);
        page.elements.openImageButton.addEventListener("click", event => {
            if (page.elements.openImageButton.classList.contains("disabled")) {
                event.preventDefault();
            }
        });
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadMethods();
            page.bindEvents();
            page.resetDetail();
            page.syncStateFromFilters(true);
            await page.loadPayments();

            const url = new URL(window.location.href);
            const selectedId = Number(url.searchParams.get("paymentId"));
            if (selectedId) {
                await page.loadQrDetail(selectedId);
            }
        } catch (error) {
            console.error("Payment QR page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn hình QR.");
        }
    });
})();
