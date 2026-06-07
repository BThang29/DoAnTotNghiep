(() => {
    "use strict";

    const page = {
        paymentApiUrl: window.appUrl("/api/admin/payment"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("paymentKeyword"),
            methodFilter: document.getElementById("paymentMethodFilter"),
            sortBy: document.getElementById("paymentSortBy"),
            sortDesc: document.getElementById("paymentSortDesc"),
            itemsPerPage: document.getElementById("paymentItemsPerPage"),
            searchButton: document.getElementById("paymentSearchButton"),
            resetButton: document.getElementById("paymentResetButton"),
            openCreateButton: document.getElementById("paymentOpenCreateButton"),
            tableBody: document.getElementById("paymentTableBody"),
            pagination: document.getElementById("paymentPagination"),
            summary: document.getElementById("paymentSummary"),
            paginationInfo: document.getElementById("paymentPaginationInfo"),
            totalCount: document.getElementById("paymentTotalCount"),
            cashCount: document.getElementById("paymentCashCount"),
            bankTransferCount: document.getElementById("paymentBankTransferCount"),
            momoCount: document.getElementById("paymentMomoCount"),
            formModal: document.getElementById("paymentFormModal"),
            formKicker: document.getElementById("paymentFormKicker"),
            formId: document.getElementById("paymentFormId"),
            formMethod: document.getElementById("paymentFormMethod"),
            formAccountName: document.getElementById("paymentFormAccountName"),
            formAccountNumber: document.getElementById("paymentFormAccountNumber"),
            formBankName: document.getElementById("paymentFormBankName"),
            formQrContent: document.getElementById("paymentFormQrContent"),
            formNote: document.getElementById("paymentFormNote"),
            formRuleText: document.getElementById("paymentFormRuleText"),
            submitButton: document.getElementById("paymentSubmitButton"),
            detailModal: document.getElementById("paymentDetailModal"),
            detailId: document.getElementById("paymentDetailId"),
            detailMethod: document.getElementById("paymentDetailMethod"),
            detailAccountName: document.getElementById("paymentDetailAccountName"),
            detailAccountNumber: document.getElementById("paymentDetailAccountNumber"),
            detailBankName: document.getElementById("paymentDetailBankName"),
            detailInvoiceId: document.getElementById("paymentDetailInvoiceId"),
            detailNote: document.getElementById("paymentDetailNote"),
            detailQrContent: document.getElementById("paymentDetailQrContent"),
            detailQrLink: document.getElementById("paymentDetailQrLink"),
            deleteModal: document.getElementById("paymentDeleteModal"),
            deleteTargetText: document.getElementById("paymentDeleteTargetText"),
            confirmDeleteButton: document.getElementById("paymentConfirmDeleteButton")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("paymentItemsPerPage")?.value) || 10,
            keyword: "",
            method: "",
            sortBy: document.getElementById("paymentSortBy")?.value || "id",
            sortDesc: document.getElementById("paymentSortDesc")?.value === "true",
            totalRows: 0,
            methods: [],
            pendingDeleteId: null,
            isDeleting: false,
            isSubmitting: false,
            editingPaymentId: null
        }
    };

    const requiredElements = [
        page.elements.keyword,
        page.elements.methodFilter,
        page.elements.sortBy,
        page.elements.sortDesc,
        page.elements.itemsPerPage,
        page.elements.searchButton,
        page.elements.resetButton,
        page.elements.openCreateButton,
        page.elements.tableBody,
        page.elements.pagination,
        page.elements.summary,
        page.elements.paginationInfo,
        page.elements.formModal,
        page.elements.formKicker,
        page.elements.formId,
        page.elements.formMethod,
        page.elements.formAccountName,
        page.elements.formAccountNumber,
        page.elements.formBankName,
        page.elements.formQrContent,
        page.elements.formNote,
        page.elements.formRuleText,
        page.elements.submitButton,
        page.elements.detailModal,
        page.elements.detailId,
        page.elements.detailMethod,
        page.elements.detailAccountName,
        page.elements.detailAccountNumber,
        page.elements.detailBankName,
        page.elements.detailInvoiceId,
        page.elements.detailNote,
        page.elements.detailQrContent,
        page.elements.detailQrLink,
        page.elements.deleteModal,
        page.elements.deleteTargetText,
        page.elements.confirmDeleteButton
    ];

    if (!window.apiClient || requiredElements.some(element => !element)) {
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
        const normalized = (method || "").toLowerCase();
        return normalized === "banktransfer" || normalized === "momo";
    };

    page.showModal = function showModal(modalElement) {
        if (window.jQuery && typeof window.jQuery.fn.modal === "function") {
            window.jQuery(modalElement).modal("show");
        }
    };

    page.hideModal = function hideModal(modalElement) {
        if (window.jQuery && typeof window.jQuery.fn.modal === "function") {
            window.jQuery(modalElement).modal("hide");
        }
    };

    page.syncStateFromFilters = function syncStateFromFilters(resetPage) {
        page.state.keyword = page.elements.keyword.value.trim();
        page.state.method = page.elements.methodFilter.value || "";
        page.state.sortBy = page.elements.sortBy.value || "id";
        page.state.sortDesc = page.elements.sortDesc.value === "true";
        page.state.itemsPerPage = Number(page.elements.itemsPerPage.value) || 10;

        if (resetPage) {
            page.state.page = 1;
        }
    };

    page.buildQueryString = function buildQueryString() {
        const params = new URLSearchParams({
            page: String(page.state.page),
            itemsPerPage: String(page.state.itemsPerPage),
            keyword: page.state.keyword,
            method: page.state.method,
            sortBy: page.state.sortBy,
            sortDesc: String(page.state.sortDesc)
        });

        return params.toString();
    };

    page.createPaginationItem = function createPaginationItem(label, pageNumber, disabled, active) {
        return `
            <li class="page-item${disabled ? " disabled" : ""}${active ? " active" : ""}">
                <button type="button" class="page-link" data-page="${pageNumber}" ${disabled ? "disabled" : ""}>${label}</button>
            </li>`;
    };

    page.renderPagination = function renderPagination(totalRows) {
        page.state.totalRows = Number(totalRows) || 0;

        const totalPages = page.state.itemsPerPage > 0
            ? Math.max(1, Math.ceil(page.state.totalRows / page.state.itemsPerPage))
            : 1;

        page.state.page = Math.min(Math.max(1, page.state.page), totalPages);

        const startItem = page.state.totalRows === 0 ? 0 : ((page.state.page - 1) * page.state.itemsPerPage) + 1;
        const endItem = page.state.totalRows === 0 ? 0 : Math.min(page.state.page * page.state.itemsPerPage, page.state.totalRows);

        page.elements.paginationInfo.textContent = `Hiển thị ${startItem}-${endItem} trên ${page.state.totalRows} kết quả | Trang ${page.state.page}/${totalPages}`;
        page.elements.summary.textContent = `Tổng ${page.state.totalRows} cấu hình thanh toán`;
        if (page.elements.totalCount) {
            page.elements.totalCount.textContent = String(page.state.totalRows);
        }

        const items = [];
        items.push(page.createPaginationItem("Prev", page.state.page - 1, page.state.page <= 1, false));

        const maxVisiblePages = 5;
        let startPage = Math.max(1, page.state.page - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
            items.push(page.createPaginationItem(String(pageNumber), pageNumber, false, pageNumber === page.state.page));
        }

        items.push(page.createPaginationItem("Next", page.state.page + 1, page.state.page >= totalPages, false));
        page.elements.pagination.innerHTML = items.join("");
    };

    page.renderTableLoading = function renderTableLoading() {
        page.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
        page.elements.paginationInfo.textContent = "Đang tải dữ liệu...";
    };

    page.renderMethodStats = function renderMethodStats(items) {
        const counts = {
            cash: 0,
            banktransfer: 0,
            momo: 0
        };

        (Array.isArray(items) ? items : []).forEach(item => {
            const key = String(item?.method ?? item?.Method ?? "").toLowerCase();
            if (Object.prototype.hasOwnProperty.call(counts, key)) {
                counts[key] += 1;
            }
        });

        if (page.elements.cashCount) {
            page.elements.cashCount.textContent = String(counts.cash);
        }
        if (page.elements.bankTransferCount) {
            page.elements.bankTransferCount.textContent = String(counts.banktransfer);
        }
        if (page.elements.momoCount) {
            page.elements.momoCount.textContent = String(counts.momo);
        }
    };

    page.renderTableRows = function renderTableRows(items) {
        page.renderMethodStats(items);

        if (!Array.isArray(items) || items.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">Không có cấu hình thanh toán nào.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = items.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const method = item?.method ?? item?.Method ?? "";
            const accountName = item?.accountName ?? item?.AccountName ?? "";
            const accountNumber = item?.accountNumber ?? item?.AccountNumber ?? "";
            const bankName = item?.bankName ?? item?.BankName ?? "";
            const note = item?.note ?? item?.Note ?? "";
            const invoiceId = item?.invoiceId ?? item?.InvoiceId;

            return `
                <tr>
                    <td>#${id}</td>
                    <td>${page.formatMethod(method)}</td>
                    <td>${page.formatValue(accountName)}</td>
                    <td>${page.formatValue(accountNumber)}</td>
                    <td>${page.formatValue(bankName)}</td>
                    <td>${page.formatValue(note)}</td>
                    <td>${invoiceId ? `#${invoiceId}` : "-"}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-info btn-sm" data-action="detail" data-id="${id}" title="Chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-primary btn-sm" data-action="edit" data-id="${id}" title="Sửa">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-action="qr" data-id="${id}" title="QR">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${id}" title="Xóa">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        }).join("");
    };

    page.populateMethodOptions = function populateMethodOptions() {
        const options = page.state.methods.map(method => `
            <option value="${method.value}">${method.name}</option>
        `).join("");

        page.elements.methodFilter.innerHTML = `<option value="">Tất cả</option>${options}`;
        page.elements.formMethod.innerHTML = options;
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

            page.state.page = Number(currentPage) || page.state.page;
            page.renderTableRows(items);
            page.renderPagination(totalRows);
        } catch (error) {
            console.error("Load payments failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">Không thể tải danh sách thanh toán.</td>
                </tr>`;
            page.elements.summary.textContent = "Tải dữ liệu thất bại";
            page.elements.paginationInfo.textContent = "Không thể tải dữ liệu.";
            page.renderMethodStats([]);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách thanh toán.");
        }
    };

    page.updateFormByMethod = function updateFormByMethod() {
        const method = page.elements.formMethod.value || "";
        const qrMethod = page.isQrMethod(method);
        const bankFieldGroups = document.querySelectorAll(".payment-bank-fields");
        const qrFieldGroups = document.querySelectorAll(".payment-qr-fields");

        bankFieldGroups.forEach(element => {
            element.style.display = qrMethod ? "" : "none";
        });

        qrFieldGroups.forEach(element => {
            element.style.display = qrMethod ? "" : "none";
        });

        if (!qrMethod) {
            page.elements.formRuleText.textContent = "Tiền mặt có thể để trống thông tin tài khoản.";
            return;
        }

        if ((method || "").toLowerCase() === "momo") {
            page.elements.formRuleText.textContent = "Momo cần số ví, nhà cung cấp và có thể nhập QR riêng nếu đã có payload.";
            return;
        }

        page.elements.formRuleText.textContent = "Chuyển khoản cần số tài khoản và tên ngân hàng. Nội dung QR có thể để trống để hệ thống tự tạo.";
    };

    page.resetForm = function resetForm() {
        page.state.editingPaymentId = null;
        page.elements.formId.value = "";
        page.elements.formAccountName.value = "";
        page.elements.formAccountNumber.value = "";
        page.elements.formBankName.value = "";
        page.elements.formQrContent.value = "";
        page.elements.formNote.value = "";
        page.elements.formMethod.value = page.state.methods[0]?.value || "";
        page.elements.formKicker.textContent = "Create Payment";
        page.updateFormByMethod();
        page.updateSubmitButtonState();
    };

    page.setFormData = function setFormData(detail) {
        page.state.editingPaymentId = Number(detail?.id ?? detail?.Id) || null;
        page.elements.formId.value = page.state.editingPaymentId ? String(page.state.editingPaymentId) : "";
        page.elements.formMethod.value = detail?.method ?? detail?.Method ?? "";
        page.elements.formAccountName.value = detail?.accountName ?? detail?.AccountName ?? "";
        page.elements.formAccountNumber.value = detail?.accountNumber ?? detail?.AccountNumber ?? "";
        page.elements.formBankName.value = detail?.bankName ?? detail?.BankName ?? "";
        page.elements.formQrContent.value = detail?.qrContent ?? detail?.QrContent ?? "";
        page.elements.formNote.value = detail?.note ?? detail?.Note ?? "";
        page.elements.formKicker.textContent = "Update Payment";
        page.updateFormByMethod();
        page.updateSubmitButtonState();
    };

    page.openCreateModal = function openCreateModal() {
        page.resetForm();
        page.showModal(page.elements.formModal);
    };

    page.openEditModal = async function openEditModal(paymentId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            const response = await apiClient.Get(`${page.paymentApiUrl}/${paymentId}`);
            const detail = page.getResultObject(response);
            page.setFormData(detail);
            page.showModal(page.elements.formModal);
        } catch (error) {
            console.error("Load payment detail for edit failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải dữ liệu thanh toán.");
        }
    };

    page.buildFormPayload = function buildFormPayload() {
        return {
            method: page.elements.formMethod.value || "",
            accountName: page.elements.formAccountName.value.trim() || null,
            accountNumber: page.elements.formAccountNumber.value.trim() || null,
            bankName: page.elements.formBankName.value.trim() || null,
            qrContent: page.elements.formQrContent.value.trim() || null,
            note: page.elements.formNote.value.trim() || null
        };
    };

    page.validateForm = function validateForm(payload) {
        if (!payload.method) {
            page.notifier?.warning("Vui lòng chọn phương thức thanh toán.");
            return false;
        }

        if (page.isQrMethod(payload.method) && (!payload.accountNumber || !payload.bankName)) {
            page.notifier?.warning("Phương thức online cần số tài khoản hoặc số ví và tên ngân hàng hoặc nhà cung cấp.");
            return false;
        }

        return true;
    };

    page.updateSubmitButtonState = function updateSubmitButtonState() {
        page.elements.submitButton.disabled = page.state.isSubmitting;
        page.elements.submitButton.innerHTML = page.state.isSubmitting
            ? '<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>Đang lưu'
            : '<i class="fas fa-save fa-sm mr-1"></i> Lưu thanh toán';
    };

    page.submitForm = async function submitForm() {
        if (!page.ensureAuthenticated() || page.state.isSubmitting) {
            return;
        }

        const payload = page.buildFormPayload();
        if (!page.validateForm(payload)) {
            return;
        }

        page.state.isSubmitting = true;
        page.updateSubmitButtonState();

        try {
            if (page.state.editingPaymentId) {
                await apiClient.Put(`${page.paymentApiUrl}/${page.state.editingPaymentId}`, payload);
                page.notifier?.success("Cập nhật thanh toán thành công.");
            } else {
                await apiClient.Post(page.paymentApiUrl, payload);
                page.notifier?.success("Tạo thanh toán thành công.");
            }

            page.hideModal(page.elements.formModal);
            await page.loadPayments();
        } catch (error) {
            console.error("Submit payment failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể lưu thanh toán.");
        } finally {
            page.state.isSubmitting = false;
            page.updateSubmitButtonState();
        }
    };

    page.openDetailModal = async function openDetailModal(paymentId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            const response = await apiClient.Get(`${page.paymentApiUrl}/${paymentId}`);
            const detail = page.getResultObject(response);
            const id = detail?.id ?? detail?.Id ?? "-";

            page.elements.detailId.textContent = `#${id}`;
            page.elements.detailMethod.textContent = page.formatMethod(detail?.method ?? detail?.Method);
            page.elements.detailAccountName.textContent = page.formatValue(detail?.accountName ?? detail?.AccountName);
            page.elements.detailAccountNumber.textContent = page.formatValue(detail?.accountNumber ?? detail?.AccountNumber);
            page.elements.detailBankName.textContent = page.formatValue(detail?.bankName ?? detail?.BankName);

            const invoiceId = detail?.invoiceId ?? detail?.InvoiceId;
            page.elements.detailInvoiceId.textContent = invoiceId ? `#${invoiceId}` : "-";
            page.elements.detailNote.textContent = page.formatValue(detail?.note ?? detail?.Note);
            page.elements.detailQrContent.textContent = page.formatValue(detail?.qrContent ?? detail?.QrContent);
            page.elements.detailQrLink.href = `/Payment/PaymentQr?paymentId=${id}`;
            page.showModal(page.elements.detailModal);
        } catch (error) {
            console.error("Load payment detail failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải chi tiết thanh toán.");
        }
    };

    page.openDeleteModal = function openDeleteModal(paymentId, description) {
        page.state.pendingDeleteId = paymentId;
        page.state.isDeleting = false;
        page.elements.deleteTargetText.textContent = description;
        page.updateDeleteButtonState();
        page.showModal(page.elements.deleteModal);
    };

    page.updateDeleteButtonState = function updateDeleteButtonState() {
        page.elements.confirmDeleteButton.disabled = page.state.isDeleting || !page.state.pendingDeleteId;
        page.elements.confirmDeleteButton.innerHTML = page.state.isDeleting
            ? '<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>Đang xóa'
            : '<i class="fas fa-trash-alt fa-sm mr-1"></i> Xóa thanh toán';
    };

    page.resetDeleteModalState = function resetDeleteModalState() {
        page.state.pendingDeleteId = null;
        page.state.isDeleting = false;
        page.elements.deleteTargetText.textContent = "-";
        page.updateDeleteButtonState();
    };

    page.deletePayment = async function deletePayment() {
        if (!page.ensureAuthenticated() || !page.state.pendingDeleteId || page.state.isDeleting) {
            return;
        }

        page.state.isDeleting = true;
        page.updateDeleteButtonState();

        try {
            await apiClient.Delete(`${page.paymentApiUrl}/${page.state.pendingDeleteId}`);
            page.notifier?.success("Xóa thanh toán thành công.");
            page.hideModal(page.elements.deleteModal);
            await page.loadPayments();
        } catch (error) {
            console.error("Delete payment failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể xóa thanh toán.");
        } finally {
            page.state.isDeleting = false;
            page.updateDeleteButtonState();
        }
    };

    page.resetFilters = function resetFilters() {
        page.elements.keyword.value = "";
        page.elements.methodFilter.value = "";
        page.elements.sortBy.value = "id";
        page.elements.sortDesc.value = "true";
        page.elements.itemsPerPage.value = "10";
        page.syncStateFromFilters(true);
        page.loadPayments();
    };

    page.bindEvents = function bindEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadPayments();
        });

        page.elements.resetButton.addEventListener("click", page.resetFilters);
        page.elements.openCreateButton.addEventListener("click", page.openCreateModal);
        page.elements.submitButton.addEventListener("click", page.submitForm);
        page.elements.confirmDeleteButton.addEventListener("click", page.deletePayment);
        page.elements.formMethod.addEventListener("change", page.updateFormByMethod);

        [page.elements.itemsPerPage, page.elements.sortBy, page.elements.sortDesc, page.elements.methodFilter].forEach(element => {
            element.addEventListener("change", () => {
                page.syncStateFromFilters(true);
                page.loadPayments();
            });
        });

        page.elements.keyword.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                page.syncStateFromFilters(true);
                page.loadPayments();
            }
        });

        page.elements.pagination.addEventListener("click", event => {
            const button = event.target.closest("[data-page]");
            if (!button) {
                return;
            }

            const targetPage = Number(button.dataset.page);
            const totalPages = page.state.itemsPerPage > 0
                ? Math.max(1, Math.ceil(page.state.totalRows / page.state.itemsPerPage))
                : 1;

            if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage > totalPages || targetPage === page.state.page) {
                return;
            }

            page.state.page = targetPage;
            page.loadPayments();
        });

        page.elements.tableBody.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const paymentId = Number(button.dataset.id);
            const row = button.closest("tr");
            const description = row ? `${row.children[1]?.textContent || ""} | ${row.children[2]?.textContent || ""}` : `#${paymentId}`;

            if (!paymentId) {
                return;
            }

            if (action === "detail") {
                page.openDetailModal(paymentId);
            }

            if (action === "edit") {
                page.openEditModal(paymentId);
            }

            if (action === "qr") {
                window.location.href = `/Payment/PaymentQr?paymentId=${paymentId}`;
            }

            if (action === "delete") {
                page.openDeleteModal(paymentId, description);
            }
        });

        if (window.jQuery && page.elements.deleteModal) {
            window.jQuery(page.elements.deleteModal).on("hidden.bs.modal", () => {
                page.resetDeleteModalState();
            });
        }

        if (window.jQuery && page.elements.formModal) {
            window.jQuery(page.elements.formModal).on("hidden.bs.modal", () => {
                page.state.isSubmitting = false;
                page.updateSubmitButtonState();
                page.resetForm();
            });
        }
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadMethods();
            page.resetForm();
            page.bindEvents();
            page.syncStateFromFilters(true);
            await page.loadPayments();
        } catch (error) {
            console.error("Payment page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn hình thanh toán.");
        }
    });
})();
