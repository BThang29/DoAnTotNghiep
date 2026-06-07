(() => {
    "use strict";

    const page = {
        roleApiUrl: window.appUrl("/api/admin/role"),
        listApiUrl: window.appUrl("/api/admin/role/getlistroles"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("roleKeyword"),
            sortBy: document.getElementById("roleSortBy"),
            sortDesc: document.getElementById("roleSortDesc"),
            itemsPerPage: document.getElementById("roleItemsPerPage"),
            searchButton: document.getElementById("roleSearchButton"),
            resetButton: document.getElementById("roleResetButton"),
            openCreateButton: document.getElementById("roleOpenCreateButton"),
            tableBody: document.getElementById("roleTableBody"),
            pagination: document.getElementById("rolePagination"),
            summary: document.getElementById("roleSummary"),
            paginationInfo: document.getElementById("rolePaginationInfo"),
            totalCount: document.getElementById("roleTotalCount"),
            descriptionCount: document.getElementById("roleDescriptionCount"),
            selectedCount: document.getElementById("roleSelectedCount")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("roleItemsPerPage")?.value) || 10,
            keyword: "",
            sortBy: document.getElementById("roleSortBy")?.value || "id",
            sortDesc: document.getElementById("roleSortDesc")?.value === "true",
            totalRows: 0,
            roles: []
        }
    };

    const requiredElements = [
        page.elements.keyword,
        page.elements.sortBy,
        page.elements.sortDesc,
        page.elements.itemsPerPage,
        page.elements.searchButton,
        page.elements.resetButton,
        page.elements.openCreateButton,
        page.elements.tableBody,
        page.elements.pagination,
        page.elements.summary,
        page.elements.paginationInfo
    ];

    if (!window.apiClient || requiredElements.some(element => !element)) {
        return;
    }

    window.rolePage = page;

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
            || response;
    };

    page.getPagingPayload = function getPagingPayload(response) {
        if (response && (response.TotalRows !== undefined || response.totalRows !== undefined)
            && (Array.isArray(response.Data) || Array.isArray(response.data))) {
            return response;
        }

        return page.getResultObject(response);
    };

    page.escapeHtml = function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    page.formatValue = function formatValue(value) {
        return value === null || value === undefined || value === "" ? "-" : value;
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
        page.elements.summary.textContent = `Tong ${page.state.totalRows} vai tro`;
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

    page.syncStateFromFilters = function syncStateFromFilters(resetPage) {
        page.state.keyword = page.elements.keyword.value.trim();
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
            sortBy: page.state.sortBy,
            sortDesc: String(page.state.sortDesc)
        }).toString();
    };

    page.renderStats = function renderStats(items) {
        const withDescriptionCount = (items || []).filter(item => String(item?.description ?? item?.Description ?? "").trim()).length;
        if (page.elements.descriptionCount) {
            page.elements.descriptionCount.textContent = String(withDescriptionCount);
        }
    };

    page.renderRows = function renderRows(items) {
        page.state.roles = Array.isArray(items) ? items : [];
        page.renderStats(page.state.roles);

        if (!Array.isArray(items) || items.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">Khong co vai tro phu hop.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = items.map(item => {
            const id = item?.id ?? item?.Id ?? 0;
            const name = item?.name ?? item?.Name ?? "";
            const description = item?.description ?? item?.Description ?? "";
            const privilegeCount = item?.privilegeCount ?? item?.PrivilegeCount ?? 0;

            return `
                <tr>
                    <td>#${id}</td>
                    <td><div class="role-name">${page.escapeHtml(name)}</div></td>
                    <td><div class="role-description">${page.escapeHtml(page.formatValue(description))}</div></td>
                    <td><span class="role-privilege-count">${privilegeCount} quyền</span></td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-info btn-sm" data-action="detail" data-id="${id}" title="Chi tiet">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning btn-sm" data-action="privileges" data-id="${id}" title="Phan quyen">
                            <i class="fas fa-user-shield"></i>
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
                <td colspan="5" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
        page.elements.paginationInfo.textContent = "Đang tải dữ liệu...";
    };

    page.loadRoles = async function loadRoles() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderLoading();

        try {
            const response = await apiClient.Get(`${page.listApiUrl}?${page.buildQueryString()}`);
            const result = page.getPagingPayload(response);
            const items = Array.isArray(result?.data ?? result?.Data) ? (result?.data ?? result?.Data) : [];
            const rolesWithCounts = await Promise.all(items.map(async item => {
                const id = item?.id ?? item?.Id ?? 0;
                let privilegeCount = 0;

                if (id > 0) {
                    try {
                        const privilegeResponse = await apiClient.Get(`${page.roleApiUrl}/${id}/privileges`, { showLoading: false });
                        const privileges = page.getResultObject(privilegeResponse);
                        privilegeCount = Array.isArray(privileges) ? privileges.length : 0;
                    } catch (error) {
                        privilegeCount = 0;
                    }
                }

                return {
                    ...item,
                    privilegeCount
                };
            }));

            const totalRows = result?.totalRows ?? result?.TotalRows ?? result?.totalRecords ?? result?.TotalRecords ?? rolesWithCounts.length;
            page.renderRows(rolesWithCounts);
            page.renderPagination(totalRows);
        } catch (error) {
            console.error("Load roles failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">Không thể tải danh sách vai trò.</td>
                </tr>`;
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách vai trò.");
        }
    };

    page.resetFilters = function resetFilters() {
        page.elements.keyword.value = "";
        page.elements.sortBy.value = "id";
        page.elements.sortDesc.value = "false";
        page.elements.itemsPerPage.value = "10";
        page.syncStateFromFilters(true);
        page.loadRoles();
    };

    page.handleTableAction = function handleTableAction(event) {
        const trigger = event.target.closest("[data-action][data-id]");
        if (!trigger) {
            return;
        }

        const roleId = Number(trigger.getAttribute("data-id"));
        const action = trigger.getAttribute("data-action");
        if (!roleId || !action) {
            return;
        }

        if (page.elements.selectedCount) {
            page.elements.selectedCount.textContent = "1";
        }

        if (action === "detail" && typeof page.openRoleDetail === "function") {
            page.openRoleDetail(roleId);
        }

        if (action === "privileges" && typeof page.openRolePrivileges === "function") {
            page.openRolePrivileges(roleId);
        }

        if (action === "delete" && typeof page.openRoleDeleteModal === "function") {
            page.openRoleDeleteModal(roleId);
        }
    };

    page.handlePaginationClick = function handlePaginationClick(event) {
        const button = event.target.closest("button[data-page]");
        if (!button || button.disabled) {
            return;
        }

        const pageNumber = Number(button.getAttribute("data-page"));
        if (!pageNumber || pageNumber === page.state.page) {
            return;
        }

        page.state.page = pageNumber;
        page.loadRoles();
    };

    page.bindEvents = function bindEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadRoles();
        });

        page.elements.resetButton.addEventListener("click", page.resetFilters);
        page.elements.openCreateButton.addEventListener("click", () => {
            if (page.elements.selectedCount) {
                page.elements.selectedCount.textContent = "0";
            }
            if (typeof page.openRoleCreateModal === "function") {
                page.openRoleCreateModal();
            }
        });
        page.elements.tableBody.addEventListener("click", page.handleTableAction);
        page.elements.pagination.addEventListener("click", page.handlePaginationClick);
        page.elements.keyword.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                page.syncStateFromFilters(true);
                page.loadRoles();
            }
        });
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            page.syncStateFromFilters(true);
            page.bindEvents();
            await page.loadRoles();
        } catch (error) {
            console.error("Role page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn vai trò.");
        }
    });
})();
