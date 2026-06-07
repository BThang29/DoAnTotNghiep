(() => {
    "use strict";

    const page = {
        otherApiUrl: window.appUrl("/api/admin/other"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("serviceKeyword"),
            typeFilter: document.getElementById("serviceTypeFilter"),
            sortBy: document.getElementById("serviceSortBy"),
            sortDesc: document.getElementById("serviceSortDesc"),
            itemsPerPage: document.getElementById("serviceItemsPerPage"),
            searchButton: document.getElementById("serviceSearchButton"),
            resetButton: document.getElementById("serviceResetButton"),
            tableBody: document.getElementById("serviceTableBody"),
            pagination: document.getElementById("servicePagination"),
            summary: document.getElementById("serviceSummary"),
            paginationInfo: document.getElementById("servicePaginationInfo"),
            totalCount: document.getElementById("serviceTotalCount"),
            inventoryCount: document.getElementById("serviceInventoryCount"),
            noInventoryCount: document.getElementById("serviceNoInventoryCount"),
            typeCount: document.getElementById("serviceTypeCount")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("serviceItemsPerPage")?.value) || 10,
            keyword: "",
            serviceTypeId: "",
            sortBy: document.getElementById("serviceSortBy")?.value || "id",
            sortDesc: document.getElementById("serviceSortDesc")?.value === "true",
            totalRows: 0,
            services: [],
            serviceTypes: []
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

    page.formatCurrency = function formatCurrency(value) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    };

    page.renderOptions = function renderOptions(selectElement, items, includeAllLabel) {
        const prefix = includeAllLabel ? `<option value="">${includeAllLabel}</option>` : "";
        selectElement.innerHTML = `${prefix}${items.map(item => `<option value="${item.id}">${item.name}</option>`).join("")}`;
    };

    page.loadServiceTypes = async function loadServiceTypes() {
        const response = await apiClient.Get(`${page.otherApiUrl}/service-types`, { showLoading: false });
        page.state.serviceTypes = (page.getResultObject(response) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.name ?? item?.Name ?? ""
        }));

        page.renderOptions(page.elements.typeFilter, page.state.serviceTypes, "Tat ca");
        if (page.elements.typeCount) {
            page.elements.typeCount.textContent = String(page.state.serviceTypes.length);
        }
    };

    page.syncStateFromFilters = function syncStateFromFilters(resetPage) {
        page.state.keyword = page.elements.keyword.value.trim();
        page.state.serviceTypeId = page.elements.typeFilter.value || "";
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
            serviceTypeId: page.state.serviceTypeId,
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

        page.elements.paginationInfo.textContent = `Hien thi ${startItem}-${endItem} tren ${page.state.totalRows} ket qua | Trang ${page.state.page}/${totalPages}`;
        page.elements.summary.textContent = `Tong ${page.state.totalRows} dich vu`;
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
        const withInventory = (items || []).filter(item => Number(item?.remainingInventory ?? item?.RemainingInventory) > 0).length;
        if (page.elements.inventoryCount) {
            page.elements.inventoryCount.textContent = String(withInventory);
        }
        if (page.elements.noInventoryCount) {
            page.elements.noInventoryCount.textContent = String(Math.max(0, (items || []).length - withInventory));
        }
    };

    page.renderRows = function renderRows(items) {
        page.state.services = Array.isArray(items) ? items : [];
        page.renderStats(page.state.services);

        if (!Array.isArray(items) || items.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">Khong co dich vu phu hop.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = items.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const nameService = item?.nameService ?? item?.NameService ?? "";
            const serviceCode = item?.serviceCode ?? item?.ServiceCode ?? "";
            const price = item?.price ?? item?.Price;
            const remainingInventory = item?.remainingInventory ?? item?.RemainingInventory;
            const unitName = item?.unitName ?? item?.UnitName ?? "";
            const serviceTypeName = item?.serviceTypeName ?? item?.ServiceTypeName ?? "";

            return `
                <tr>
                    <td>#${id}</td>
                    <td>${page.formatValue(nameService)}</td>
                    <td>${page.formatValue(serviceCode)}</td>
                    <td>${page.formatCurrency(price)}</td>
                    <td>${page.formatValue(remainingInventory)}</td>
                    <td>${page.formatValue(unitName)}</td>
                    <td><div class="other-type-label">${page.formatValue(serviceTypeName)}</div></td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-info btn-sm" data-action="detail" data-id="${id}" title="Chi tiet">
                            <i class="fas fa-eye"></i>
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
                <td colspan="8" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
        page.elements.paginationInfo.textContent = "Đang tải dữ liệu...";
    };

    page.loadServices = async function loadServices() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderLoading();

        try {
            const response = await apiClient.Get(`${page.otherApiUrl}/services?${page.buildQueryString()}`);
            const result = page.getResultObject(response);
            const items = result?.data ?? result?.Data ?? [];
            const totalRows = result?.totalRows ?? result?.TotalRows ?? items.length;
            const currentPage = result?.currentPage ?? result?.CurrentPage ?? page.state.page;
            page.state.page = Number(currentPage) || page.state.page;
            page.renderRows(items);
            page.renderPagination(totalRows);
        } catch (error) {
            console.error("Load services failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">Không thể tải danh sách dịch vụ.</td>
                </tr>`;
            page.elements.summary.textContent = "Tai du lieu that bai";
            page.elements.paginationInfo.textContent = "Không thể tải dữ liệu.";
            page.renderStats([]);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách dịch vụ.");
        }
    };

    page.resetFilters = function resetFilters() {
        page.elements.keyword.value = "";
        page.elements.typeFilter.value = "";
        page.elements.sortBy.value = "id";
        page.elements.sortDesc.value = "true";
        page.elements.itemsPerPage.value = "10";
        page.syncStateFromFilters(true);
        page.loadServices();
    };

    page.bindEvents = function bindEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadServices();
        });

        page.elements.resetButton.addEventListener("click", page.resetFilters);

        [page.elements.typeFilter, page.elements.sortBy, page.elements.sortDesc, page.elements.itemsPerPage].forEach(element => {
            element.addEventListener("change", () => {
                page.syncStateFromFilters(true);
                page.loadServices();
            });
        });

        page.elements.keyword.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                page.syncStateFromFilters(true);
                page.loadServices();
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
            page.loadServices();
        });

        page.elements.tableBody.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const serviceId = Number(button.dataset.id);
            if (!serviceId) {
                return;
            }

            if (action === "detail" && typeof page.openServiceDetail === "function") {
                page.openServiceDetail(serviceId);
            }

            if (action === "delete" && typeof page.openServiceDeleteModal === "function") {
                page.openServiceDeleteModal(serviceId);
            }
        });
    };

    window.otherServicePage = page;

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadServiceTypes();
            page.bindEvents();
            page.syncStateFromFilters(true);
            await page.loadServices();
        } catch (error) {
            console.error("Service page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn dịch vụ.");
        }
    });
})();
