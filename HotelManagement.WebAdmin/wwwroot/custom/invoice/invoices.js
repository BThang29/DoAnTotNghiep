(() => {
    "use strict";

    const page = {
        invoiceApiUrl: window.appUrl("/api/admin/invoice"),
        bookingApiUrl: window.appUrl("/api/admin/booking-room"),
        serviceApiUrl: window.appUrl("/api/admin/other/services"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("invoiceKeyword"),
            bookingId: document.getElementById("invoiceBookingId"),
            sortBy: document.getElementById("invoiceSortBy"),
            sortDesc: document.getElementById("invoiceSortDesc"),
            itemsPerPage: document.getElementById("invoiceItemsPerPage"),
            searchButton: document.getElementById("invoiceSearchButton"),
            resetButton: document.getElementById("invoiceResetButton"),
            tableBody: document.getElementById("invoiceTableBody"),
            pagination: document.getElementById("invoicePagination"),
            summary: document.getElementById("invoiceSummary"),
            paginationInfo: document.getElementById("invoicePaginationInfo"),
            totalCount: document.getElementById("invoiceTotalCount"),
            pageRevenue: document.getElementById("invoicePageRevenue"),
            pageRoomCharge: document.getElementById("invoicePageRoomCharge"),
            pageServiceCharge: document.getElementById("invoicePageServiceCharge"),
            deleteModal: document.getElementById("invoiceDeleteModal"),
            deleteTargetId: document.getElementById("invoiceDeleteTargetId"),
            confirmDeleteButton: document.getElementById("invoiceConfirmDeleteButton")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("invoiceItemsPerPage")?.value) || 10,
            keyword: "",
            bookingId: "",
            sortBy: document.getElementById("invoiceSortBy")?.value || "id",
            sortDesc: document.getElementById("invoiceSortDesc")?.value === "true",
            totalRows: 0,
            bookings: [],
            services: [],
            selectedServices: [],
            lastCalculation: null,
            currentDetailId: null,
            pendingDeleteId: null,
            isDeleting: false
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

    page.formatDate = function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(date);
    };

    page.formatDateForInput = function formatDateForInput(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toISOString().slice(0, 10);
    };

    page.formatCurrency = function formatCurrency(value) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    };

    page.formatValue = function formatValue(value) {
        return value === null || value === undefined || value === "" ? "-" : value;
    };

    page.parseNumber = function parseNumber(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
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
        page.state.bookingId = page.elements.bookingId.value.trim();
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
            bookingId: page.state.bookingId,
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
        page.elements.summary.textContent = `Tổng ${page.state.totalRows} hóa đơn`;
        page.elements.totalCount.textContent = String(page.state.totalRows);

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
                <td colspan="10" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
        page.elements.paginationInfo.textContent = "Đang tải dữ liệu...";
    };

    page.renderTableRows = function renderTableRows(items) {
        if (!Array.isArray(items) || items.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted">Không có hóa đơn nào.</td>
                </tr>`;
            page.elements.pageRevenue.textContent = page.formatCurrency(0);
            page.elements.pageRoomCharge.textContent = page.formatCurrency(0);
            page.elements.pageServiceCharge.textContent = page.formatCurrency(0);
            return;
        }

        let totalAmount = 0;
        let roomCharge = 0;
        let serviceCharge = 0;

        page.elements.tableBody.innerHTML = items.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const bookingId = item?.bookingId ?? item?.BookingId ?? "-";
            const customerName = item?.customerName ?? item?.CustomerName ?? "-";
            const roomName = item?.roomName ?? item?.RoomName ?? "-";
            const employeeName = item?.employeeName ?? item?.EmployeeName ?? "-";
            const issueDate = item?.issueDate ?? item?.IssueDate;
            const rowRoomCharge = page.parseNumber(item?.roomCharge ?? item?.RoomCharge);
            const rowServiceCharge = page.parseNumber(item?.serviceCharge ?? item?.ServiceCharge);
            const rowTotalAmount = page.parseNumber(item?.totalAmount ?? item?.TotalAmount);

            totalAmount += rowTotalAmount;
            roomCharge += rowRoomCharge;
            serviceCharge += rowServiceCharge;

            return `
                <tr>
                    <td>#${id}</td>
                    <td>${bookingId}</td>
                    <td>${customerName}</td>
                    <td>${roomName}</td>
                    <td>${employeeName}</td>
                    <td>${page.formatDate(issueDate)}</td>
                    <td>${page.formatCurrency(rowRoomCharge)}</td>
                    <td>${page.formatCurrency(rowServiceCharge)}</td>
                    <td><strong>${page.formatCurrency(rowTotalAmount)}</strong></td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-info btn-sm" data-action="detail" data-id="${id}" title="Chi tiet">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-action="print" data-id="${id}" title="In hoa don">
                            <i class="fas fa-print"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${id}" title="Xóa hóa đơn">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        }).join("");

        page.elements.pageRevenue.textContent = page.formatCurrency(totalAmount);
        page.elements.pageRoomCharge.textContent = page.formatCurrency(roomCharge);
        page.elements.pageServiceCharge.textContent = page.formatCurrency(serviceCharge);
    };

    page.loadInvoices = async function loadInvoices() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderTableLoading();

        try {
            const response = await apiClient.Get(`${page.invoiceApiUrl}?${page.buildQueryString()}`);
            const result = page.getResultObject(response);
            const items = result?.data ?? result?.Data ?? [];
            const totalRows = result?.totalRows ?? result?.TotalRows ?? items.length;
            const currentPage = result?.currentPage ?? result?.CurrentPage ?? page.state.page;

            page.state.page = Number(currentPage) || page.state.page;
            page.renderTableRows(items);
            page.renderPagination(totalRows);
        } catch (error) {
            console.error("Load invoices failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-danger">Không thể tải danh sách hóa đơn.</td>
                </tr>`;
            page.elements.summary.textContent = "Tai du lieu that bai";
            page.elements.paginationInfo.textContent = "Không thể tải dữ liệu.";
            page.elements.pageRevenue.textContent = page.formatCurrency(0);
            page.elements.pageRoomCharge.textContent = page.formatCurrency(0);
            page.elements.pageServiceCharge.textContent = page.formatCurrency(0);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách hóa đơn.");
        }
    };

    page.openDeleteModal = function openDeleteModal(invoiceId) {
        page.state.pendingDeleteId = invoiceId;
        page.state.isDeleting = false;
        page.elements.deleteTargetId.textContent = `#${invoiceId}`;
        page.updateDeleteButtonState();
        page.showModal(page.elements.deleteModal);
    };

    page.updateDeleteButtonState = function updateDeleteButtonState() {
        page.elements.confirmDeleteButton.disabled = page.state.isDeleting || !page.state.pendingDeleteId;
        page.elements.confirmDeleteButton.innerHTML = page.state.isDeleting
            ? '<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>Đang xóa'
            : '<i class="fas fa-trash-alt fa-sm mr-1"></i> Xóa hóa đơn';
    };

    page.resetDeleteModalState = function resetDeleteModalState() {
        page.state.pendingDeleteId = null;
        page.state.isDeleting = false;
        page.elements.deleteTargetId.textContent = "-";
        page.updateDeleteButtonState();
    };

    page.deleteInvoice = async function deleteInvoice() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        if (!page.state.pendingDeleteId || page.state.isDeleting) {
            return;
        }

        page.state.isDeleting = true;
        page.updateDeleteButtonState();

        try {
            await apiClient.Delete(`${page.invoiceApiUrl}/${page.state.pendingDeleteId}`);
            if (typeof page.notifier?.success === "function") {
                page.notifier.success("Xóa hóa đơn thành công.");
            }

            page.hideModal(page.elements.deleteModal);
            await page.loadInvoices();
        } catch (error) {
            console.error("Delete invoice failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể xóa hóa đơn.");
        } finally {
            page.state.isDeleting = false;
            page.updateDeleteButtonState();
        }
    };

    page.resetFilters = function resetFilters() {
        page.elements.keyword.value = "";
        page.elements.bookingId.value = "";
        page.elements.sortBy.value = "id";
        page.elements.sortDesc.value = "true";
        page.elements.itemsPerPage.value = "10";
        page.syncStateFromFilters(true);
        page.loadInvoices();
    };

    page.bindListEvents = function bindListEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadInvoices();
        });

        page.elements.resetButton.addEventListener("click", page.resetFilters);
        page.elements.confirmDeleteButton.addEventListener("click", () => {
            page.deleteInvoice();
        });

        page.elements.itemsPerPage.addEventListener("change", () => {
            page.syncStateFromFilters(true);
            page.loadInvoices();
        });

        page.elements.sortBy.addEventListener("change", () => {
            page.syncStateFromFilters(true);
            page.loadInvoices();
        });

        page.elements.sortDesc.addEventListener("change", () => {
            page.syncStateFromFilters(true);
            page.loadInvoices();
        });

        [page.elements.keyword, page.elements.bookingId].forEach(input => {
            input.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    page.syncStateFromFilters(true);
                    page.loadInvoices();
                }
            });
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
            page.loadInvoices();
        });

        page.elements.tableBody.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const invoiceId = Number(button.dataset.id);
            if (!invoiceId) {
                return;
            }

            if (action === "detail" && typeof page.openInvoiceDetail === "function") {
                page.openInvoiceDetail(invoiceId);
            }

            if (action === "print" && typeof page.printInvoice === "function") {
                page.printInvoice(invoiceId);
            }

            if (action === "delete" && typeof page.deleteInvoice === "function") {
                page.openDeleteModal(invoiceId);
            }
        });

        if (window.jQuery && page.elements.deleteModal) {
            window.jQuery(page.elements.deleteModal).on("hidden.bs.modal", () => {
                page.resetDeleteModalState();
            });
        }
    };

    window.invoicePage = page;

    document.addEventListener("DOMContentLoaded", () => {
        page.bindListEvents();
        page.syncStateFromFilters(true);
        page.loadInvoices();
    });
})();
