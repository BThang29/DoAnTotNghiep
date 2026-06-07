(() => {
    "use strict";

    const page = {
        customerApiUrl: window.appUrl("/api/admin/customer"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("customerKeyword"),
            typeFilter: document.getElementById("customerTypeFilter"),
            sortBy: document.getElementById("customerSortBy"),
            sortDesc: document.getElementById("customerSortDesc"),
            itemsPerPage: document.getElementById("customerItemsPerPage"),
            searchButton: document.getElementById("customerSearchButton"),
            resetButton: document.getElementById("customerResetButton"),
            tableBody: document.getElementById("customerTableBody"),
            pagination: document.getElementById("customerPagination"),
            summary: document.getElementById("customerSummary"),
            paginationInfo: document.getElementById("customerPaginationInfo"),
            totalCount: document.getElementById("customerTotalCount"),
            vipCount: document.getElementById("customerVipCount"),
            normalCount: document.getElementById("customerNormalCount"),
            emailCount: document.getElementById("customerEmailCount")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("customerItemsPerPage")?.value) || 10,
            keyword: "",
            customerTypeId: "",
            sortBy: document.getElementById("customerSortBy")?.value || "id",
            sortDesc: document.getElementById("customerSortDesc")?.value === "true",
            totalRows: 0,
            customerTypes: [],
            customers: []
        }
    };

    const requiredElements = [
        page.elements.keyword,
        page.elements.typeFilter,
        page.elements.sortBy,
        page.elements.sortDesc,
        page.elements.itemsPerPage,
        page.elements.searchButton,
        page.elements.resetButton,
        page.elements.tableBody,
        page.elements.pagination,
        page.elements.summary,
        page.elements.paginationInfo
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

    page.toDateInputValue = function toDateInputValue(value) {
        if (!value) {
            return "";
        }

        const normalized = String(value);
        if (normalized.length >= 10 && normalized.includes("-")) {
            return normalized.substring(0, 10);
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    page.formatDate = function formatDate(item) {
        const rawValue = item?.dobStr ?? item?.DobStr ?? item?.dob ?? item?.Dob ?? "";
        if (!rawValue) {
            return "-";
        }

        if (typeof rawValue === "string" && rawValue.includes("/")) {
            return rawValue;
        }

        const date = new Date(rawValue);
        if (Number.isNaN(date.getTime())) {
            return page.formatValue(rawValue);
        }

        return date.toLocaleDateString("vi-VN");
    };

    page.normalizeTypeClass = function normalizeTypeClass(typeName) {
        const key = String(typeName || "").trim().toLowerCase();
        if (key === "vip") {
            return "vip";
        }

        if (key === "thuong" || key === "thường" || key === "normal") {
            return "normal";
        }

        return "default";
    };

    page.renderOptions = function renderOptions(selectElement, items, includeAllLabel) {
        const prefix = includeAllLabel ? `<option value="">${includeAllLabel}</option>` : "";
        selectElement.innerHTML = `${prefix}${items.map(item => `<option value="${item.id}">${item.name}</option>`).join("")}`;
    };

    page.loadLookups = async function loadLookups() {
        const response = await apiClient.Get(`${page.customerApiUrl}/types`, { showLoading: false });
        page.state.customerTypes = (page.getResultObject(response) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.name ?? item?.Name ?? ""
        }));

        page.renderOptions(page.elements.typeFilter, page.state.customerTypes, "Tat ca");
    };

    page.syncStateFromFilters = function syncStateFromFilters(resetPage) {
        page.state.keyword = page.elements.keyword.value.trim();
        page.state.customerTypeId = page.elements.typeFilter.value || "";
        page.state.sortBy = page.elements.sortBy.value || "id";
        page.state.sortDesc = page.elements.sortDesc.value === "true";
        page.state.itemsPerPage = Number(page.elements.itemsPerPage.value) || 10;

        if (resetPage) {
            page.state.page = 1;
        }
    };

    page.buildQueryString = function buildQueryString() {
        return new URLSearchParams({
            page: String(page.state.page),
            itemsPerPage: String(page.state.itemsPerPage),
            keyword: page.state.keyword,
            customerTypeId: page.state.customerTypeId,
            sortBy: page.state.sortBy,
            sortDesc: String(page.state.sortDesc)
        }).toString();
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
        page.elements.summary.textContent = `Tổng ${page.state.totalRows} khách hàng`;
        if (page.elements.totalCount) {
            page.elements.totalCount.textContent = String(page.state.totalRows);
        }

        const items = [page.createPaginationItem("Prev", page.state.page - 1, page.state.page <= 1, false)];
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

    page.renderStats = function renderStats(items) {
        let vipCount = 0;
        let normalCount = 0;
        let emailCount = 0;

        (items || []).forEach(item => {
            const typeName = String(item?.customerTypeName ?? item?.CustomerTypeName ?? "").trim().toLowerCase();
            if (typeName === "vip") {
                vipCount += 1;
            } else if (typeName === "thuong" || typeName === "thường" || typeName === "normal") {
                normalCount += 1;
            }

            if (String(item?.mail ?? item?.Mail ?? "").trim()) {
                emailCount += 1;
            }
        });

        if (page.elements.vipCount) {
            page.elements.vipCount.textContent = String(vipCount);
        }
        if (page.elements.normalCount) {
            page.elements.normalCount.textContent = String(normalCount);
        }
        if (page.elements.emailCount) {
            page.elements.emailCount.textContent = String(emailCount);
        }
    };

    page.renderRows = function renderRows(items) {
        page.state.customers = Array.isArray(items) ? items : [];
        page.renderStats(page.state.customers);

        if (!Array.isArray(items) || items.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">Khong co khach hang phu hop.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = items.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const fullName = item?.fullName ?? item?.FullName ?? "";
            const identify = item?.identify ?? item?.Identify ?? "";
            const phone = item?.phone ?? item?.Phone ?? "";
            const mail = item?.mail ?? item?.Mail ?? "";
            return `
                <tr>
                    <td>#${id}</td>
                    <td>${page.formatValue(fullName)}</td>
                    <td>${page.formatValue(identify)}</td>
                    <td>${page.formatValue(phone)}</td>
                    <td>${page.formatValue(mail)}</td>
                    <td>${page.formatDate(item)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-info btn-sm" data-action="detail" data-id="${id}" title="Chi tiet">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning btn-sm" data-action="type" data-id="${id}" title="Loai khach hang">
                            <i class="fas fa-user-tag"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${id}" title="Xoa">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        }).join("");
    };

    page.renderLoading = function renderLoading() {
        page.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
        page.elements.paginationInfo.textContent = "Đang tải dữ liệu...";
    };

    page.loadCustomers = async function loadCustomers() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderLoading();

        try {
            const response = await apiClient.Get(`${page.customerApiUrl}?${page.buildQueryString()}`);
            const result = page.getResultObject(response);
            const items = result?.data ?? result?.Data ?? [];
            const totalRows = result?.totalRows ?? result?.TotalRows ?? items.length;
            const currentPage = result?.currentPage ?? result?.CurrentPage ?? page.state.page;
            page.state.page = Number(currentPage) || page.state.page;
            page.renderRows(items);
            page.renderPagination(totalRows);
        } catch (error) {
            console.error("Load customers failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">Không thể tải danh sách khách hàng.</td>
                </tr>`;
            page.elements.summary.textContent = "Tai du lieu that bai";
            page.elements.paginationInfo.textContent = "Không thể tải dữ liệu.";
            page.renderStats([]);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách khách hàng.");
        }
    };

    page.resetFilters = function resetFilters() {
        page.elements.keyword.value = "";
        page.elements.typeFilter.value = "";
        page.elements.sortBy.value = "id";
        page.elements.sortDesc.value = "false";
        page.elements.itemsPerPage.value = "10";
        page.syncStateFromFilters(true);
        page.loadCustomers();
    };

    page.bindEvents = function bindEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadCustomers();
        });

        page.elements.resetButton.addEventListener("click", page.resetFilters);

        [page.elements.typeFilter, page.elements.sortBy, page.elements.sortDesc, page.elements.itemsPerPage].forEach(element => {
            element.addEventListener("change", () => {
                page.syncStateFromFilters(true);
                page.loadCustomers();
            });
        });

        page.elements.keyword.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                page.syncStateFromFilters(true);
                page.loadCustomers();
            }
        });

        page.elements.pagination.addEventListener("click", event => {
            const button = event.target.closest("[data-page]");
            if (!button) {
                return;
            }

            const targetPage = Number(button.dataset.page);
            const totalPages = page.state.itemsPerPage > 0 ? Math.max(1, Math.ceil(page.state.totalRows / page.state.itemsPerPage)) : 1;
            if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage > totalPages || targetPage === page.state.page) {
                return;
            }

            page.state.page = targetPage;
            page.loadCustomers();
        });

        page.elements.tableBody.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const customerId = Number(button.dataset.id);
            if (!customerId) {
                return;
            }

            if (action === "detail" && typeof page.openCustomerDetail === "function") {
                page.openCustomerDetail(customerId);
            }

            if (action === "type" && typeof page.openCustomerTypeModal === "function") {
                page.openCustomerTypeModal(customerId);
            }

            if (action === "delete" && typeof page.openCustomerDeleteModal === "function") {
                page.openCustomerDeleteModal(customerId);
            }
        });
    };

    window.customerPage = page;

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadLookups();
            page.bindEvents();
            page.syncStateFromFilters(true);
            await page.loadCustomers();
        } catch (error) {
            console.error("Customer page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn hình khách hàng.");
        }
    });
})();
