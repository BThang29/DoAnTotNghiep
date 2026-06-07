(() => {
    "use strict";

    const page = {
        employeeApiUrl: window.appUrl("/api/admin/employee"),
        roleApiUrl: window.appUrl("/api/admin/role/getlistroles"),
        notifier: window.appNotifier,
        elements: {
            keyword: document.getElementById("employeeKeyword"),
            roleFilter: document.getElementById("employeeRoleFilter"),
            adminFilter: document.getElementById("employeeAdminFilter"),
            sortBy: document.getElementById("employeeSortBy"),
            sortDesc: document.getElementById("employeeSortDesc"),
            itemsPerPage: document.getElementById("employeeItemsPerPage"),
            searchButton: document.getElementById("employeeSearchButton"),
            resetButton: document.getElementById("employeeResetButton"),
            tableBody: document.getElementById("employeeTableBody"),
            pagination: document.getElementById("employeePagination"),
            summary: document.getElementById("employeeSummary"),
            paginationInfo: document.getElementById("employeePaginationInfo"),
            totalCount: document.getElementById("employeeTotalCount"),
            adminCount: document.getElementById("employeeAdminCount"),
            emailCount: document.getElementById("employeeEmailCount"),
            phoneCount: document.getElementById("employeePhoneCount")
        },
        state: {
            page: 1,
            itemsPerPage: Number(document.getElementById("employeeItemsPerPage")?.value) || 5,
            keyword: "",
            roleId: "",
            adminFilter: "",
            sortBy: document.getElementById("employeeSortBy")?.value || "id",
            sortDesc: document.getElementById("employeeSortDesc")?.value === "true",
            totalRows: 0,
            employees: [],
            roleOptions: [],
            isHighestAdministrator: false,
            canViewRoles: false,
            detailRoleIds: [],
            detailRoleNames: []
        }
    };

    const requiredElements = [
        page.elements.keyword,
        page.elements.roleFilter,
        page.elements.adminFilter,
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

    window.employeePage = page;

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

    page.getPagingValue = function getPagingValue(response, result, camelKey, pascalKey) {
        return result?.[camelKey]
            ?? result?.[pascalKey]
            ?? response?.[camelKey]
            ?? response?.[pascalKey];
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

    page.toBoolean = function toBoolean(value) {
        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "string") {
            return value.toLowerCase() === "true";
        }

        return Boolean(value);
    };

    page.getCurrentUserClaims = function getCurrentUserClaims() {
        const currentUser = apiClient.getCurrentUser?.();
        return Array.isArray(currentUser?.claims) ? currentUser.claims : [];
    };

    page.getCurrentUserPrivileges = function getCurrentUserPrivileges() {
        const currentUser = apiClient.getCurrentUser?.();
        return Array.isArray(currentUser?.privileges) ? currentUser.privileges : [];
    };

    page.hasAnyPrivilege = function hasAnyPrivilege(privileges) {
        const currentPrivileges = new Set(
            page.getCurrentUserPrivileges()
                .filter(Boolean)
                .map(item => String(item).trim())
        );

        return (privileges || []).some(item => currentPrivileges.has(String(item)));
    };

    page.getClaimValue = function getClaimValue(claimType) {
        const normalizedType = String(claimType || "").toLowerCase();
        const claim = page.getCurrentUserClaims().find(item => {
            const type = String(item?.type ?? item?.Type ?? "").toLowerCase();
            return type === normalizedType;
        });

        return claim?.value ?? claim?.Value ?? "";
    };

    page.resolveHighestAdministrator = function resolveHighestAdministrator() {
        const claimValue = String(page.getClaimValue("is_administrator")).toLowerCase();
        page.state.isHighestAdministrator = claimValue === "true";
        page.state.canViewRoles = page.hasAnyPrivilege(["ViewRole", "ManageRole"]);
    };

    page.getEmployeeRoles = function getEmployeeRoles(item) {
        const roles = item?.roles ?? item?.Roles ?? [];
        return Array.isArray(roles) ? roles.filter(Boolean) : [];
    };

    page.normalizeEmployee = function normalizeEmployee(item) {
        return {
            id: Number(item?.id ?? item?.Id ?? 0),
            userName: item?.userName ?? item?.UserName ?? "",
            fullName: item?.fullName ?? item?.FullName ?? "",
            email: item?.email ?? item?.Email ?? "",
            phoneNumber: item?.phoneNumber ?? item?.PhoneNumber ?? "",
            address: item?.address ?? item?.Address ?? "",
            createDate: item?.createDate ?? item?.CreateDate ?? "",
            roles: page.getEmployeeRoles(item),
            isAdministrator: page.toBoolean(item?.isAdministrator ?? item?.IsAdministrator),
            active: Number(item?.active ?? item?.Active ?? 0),
            backgroundImage: item?.backgroundImage ?? item?.BackgroundImage ?? item?.backgroundimage ?? ""
        };
    };

    page.resolveImageUrl = function resolveImageUrl(path) {
        const rawValue = String(path || "").trim();
        if (!rawValue) {
            return "/images/user.png";
        }

        if (/^https?:\/\//i.test(rawValue) || rawValue.startsWith("data:") || rawValue.startsWith("/")) {
            return rawValue;
        }

        const normalizedValue = rawValue.replace(/^\/+/, "").replace(/\\/g, "/");
        if (normalizedValue.includes("/")) {
            return `/${normalizedValue}`;
        }

        return `/images/${normalizedValue}`;
    };

    page.formatDate = function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return page.formatValue(value);
        }

        return date.toLocaleDateString("vi-VN");
    };

    page.renderRoleFilterOptions = function renderRoleFilterOptions() {
        if (!page.state.canViewRoles) {
            page.elements.roleFilter.innerHTML = `<option value="">Khong co quyen xem vai tro</option>`;
            page.elements.roleFilter.value = "";
            page.elements.roleFilter.disabled = true;
            return;
        }

        page.elements.roleFilter.disabled = false;
        page.elements.roleFilter.innerHTML = [`<option value="">Tất cả</option>`]
            .concat(page.state.roleOptions.map(item => `<option value="${item.id}">${page.escapeHtml(item.name)}</option>`))
            .join("");
    };

    page.renderPaginationItem = function renderPaginationItem(label, pageNumber, disabled, active) {
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
        page.elements.summary.textContent = `Tổng ${page.state.totalRows} nhân viên`;
        if (page.elements.totalCount) {
            page.elements.totalCount.textContent = String(page.state.totalRows);
        }

        const items = [page.renderPaginationItem("Prev", page.state.page - 1, page.state.page <= 1, false)];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, page.state.page - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
            items.push(page.renderPaginationItem(String(pageNumber), pageNumber, false, pageNumber === page.state.page));
        }

        items.push(page.renderPaginationItem("Next", page.state.page + 1, page.state.page >= totalPages, false));
        page.elements.pagination.innerHTML = items.join("");
    };

    page.renderStats = function renderStats(items) {
        const normalizedItems = Array.isArray(items) ? items.map(page.normalizeEmployee) : [];
        const adminCount = normalizedItems.filter(item => item.isAdministrator).length;
        const emailCount = normalizedItems.filter(item => item.email.trim()).length;
        const phoneCount = normalizedItems.filter(item => item.phoneNumber.trim()).length;

        if (page.elements.adminCount) {
            page.elements.adminCount.textContent = String(adminCount);
        }
        if (page.elements.emailCount) {
            page.elements.emailCount.textContent = String(emailCount);
        }
        if (page.elements.phoneCount) {
            page.elements.phoneCount.textContent = String(phoneCount);
        }
    };

    page.getFilteredEmployees = function getFilteredEmployees() {
        return page.state.employees
            .filter(page.matchesRoleFilter)
            .filter(page.matchesAdminFilter)
            .map(page.normalizeEmployee);
    };

    page.matchesRoleFilter = function matchesRoleFilter(item) {
        if (!page.state.canViewRoles || !page.state.roleId) {
            return true;
        }

        const role = page.state.roleOptions.find(option => String(option.id) === String(page.state.roleId));
        if (!role) {
            return true;
        }

        return page.getEmployeeRoles(item).some(roleName => String(roleName).toLowerCase() === String(role.name).toLowerCase());
    };

    page.matchesAdminFilter = function matchesAdminFilter(item) {
        if (page.state.adminFilter === "") {
            return true;
        }

        const isAdministrator = page.toBoolean(item?.isAdministrator ?? item?.IsAdministrator);
        return String(isAdministrator) === String(page.state.adminFilter);
    };

    page.getAccountStatusMarkup = function getAccountStatusMarkup(item) {
        if (item.active === 1) {
            return '<span class="badge badge-success">Đã kích hoạt</span>';
        }

        return '<span class="badge badge-warning">Chờ duyệt</span>';
    };

    page.getActionMarkup = function getActionMarkup(item) {
        const buttons = [
            `<button type="button" class="btn btn-outline-info btn-sm" data-action="detail" data-id="${item.id}" title="Chi tiết">
                <i class="fas fa-eye"></i>
            </button>`
        ];

        if (item.active !== 1 && page.state.isHighestAdministrator) {
            buttons.push(`
                <button type="button" class="btn btn-outline-success btn-sm" data-action="activate" data-id="${item.id}" title="Kích hoạt tài khoản">
                    <i class="fas fa-check"></i>
                </button>`);
        }

        buttons.push(`
            <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${item.id}" title="Xóa">
                <i class="fas fa-trash-alt"></i>
            </button>`);

        return `<div class="d-inline-flex align-items-center flex-wrap justify-content-center" style="gap:.35rem;">${buttons.join("")}</div>`;
    };

    page.renderRows = function renderRows(items) {
        if (Array.isArray(items)) {
            page.state.employees = items;
        }

        page.renderStats(page.state.employees);

        const filteredItems = page.getFilteredEmployees();
        const startIndex = Math.max(0, (page.state.page - 1) * page.state.itemsPerPage);
        const pagedItems = filteredItems.slice(startIndex, startIndex + page.state.itemsPerPage);

        if (pagedItems.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">Không có nhân viên phù hợp.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = pagedItems.map(item => {
            const roleBadges = item.roles.length > 0
                ? item.roles.map(role => `<span class="employee-role-badge">${page.escapeHtml(role)}</span>`).join("")
                : `<span class="text-muted">-</span>`;

            return `
                <tr>
                    <td>#${item.id}</td>
                    <td>
                        <div class="employee-identity">
                            <img class="employee-avatar-thumb" src="${page.escapeHtml(page.resolveImageUrl(item.backgroundImage))}" alt="${page.escapeHtml(item.fullName || item.userName)}">
                            <div>
                                <div class="employee-name">${page.escapeHtml(item.fullName || item.userName || `#${item.id}`)}</div>
                                <div class="employee-subtitle">@${page.escapeHtml(item.userName || "-")}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="employee-contact-line">${page.escapeHtml(item.email || "-")}</div>
                        <div class="employee-contact-line">${page.escapeHtml(item.phoneNumber || "-")}</div>
                    </td>
                    <td>
                        <div class="employee-table-role-stack">
                            <div class="employee-role-badges">${roleBadges}</div>
                            <span class="employee-admin-badge ${item.isAdministrator ? "is-admin" : "is-staff"}">${item.isAdministrator ? "Quản trị viên" : "Nhân viên thường"}</span>
                        </div>
                    </td>
                    <td>${page.getAccountStatusMarkup(item)}</td>
                    <td>${page.escapeHtml(page.formatDate(item.createDate))}</td>
                    <td class="text-center">${page.getActionMarkup(item)}</td>
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

    page.syncStateFromFilters = function syncStateFromFilters(resetPage) {
        page.state.keyword = page.elements.keyword.value.trim();
        page.state.roleId = page.elements.roleFilter.value || "";
        page.state.adminFilter = page.elements.adminFilter.value;
        page.state.sortBy = page.elements.sortBy.value || "id";
        page.state.sortDesc = page.elements.sortDesc.value === "true";
        page.state.itemsPerPage = Number(page.elements.itemsPerPage.value) || 5;

        if (resetPage) {
            page.state.page = 1;
        }
    };

    page.buildQueryString = function buildQueryString() {
        return new URLSearchParams({
            page: "1",
            itemsPerPage: "1000",
            keyword: page.state.keyword,
            sortBy: page.state.sortBy,
            sortDesc: String(page.state.sortDesc)
        }).toString();
    };

    page.loadRoleOptions = async function loadRoleOptions() {
        if (!page.state.canViewRoles) {
            page.state.roleOptions = [];
            page.renderRoleFilterOptions();
            return;
        }

        const response = await apiClient.Get(`${page.roleApiUrl}?page=1&itemsPerPage=200&sortBy=id&sortDesc=false`, { showLoading: false });
        const result = page.getResultObject(response);
        const roleItems = Array.isArray(result?.data ?? result?.Data)
            ? (result?.data ?? result?.Data)
            : Array.isArray(result)
                ? result
                : [];

        page.state.roleOptions = roleItems
            .map(item => ({
                id: item?.id ?? item?.Id ?? 0,
                name: item?.name ?? item?.Name ?? "",
                description: item?.description ?? item?.Description ?? ""
            }))
            .filter(item => item.id && item.name && item.name.toLowerCase() !== "customer");

        page.renderRoleFilterOptions();
    };

    page.loadEmployees = async function loadEmployees() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderLoading();

        try {
            const response = await apiClient.Get(`${page.employeeApiUrl}?${page.buildQueryString()}`);
            const result = page.getResultObject(response);
            const items = Array.isArray(result?.data ?? result?.Data) ? (result?.data ?? result?.Data) : [];
            const totalRows = items
                .filter(page.matchesRoleFilter)
                .filter(page.matchesAdminFilter)
                .length;

            page.renderPagination(totalRows);
            page.renderRows(items);
        } catch (error) {
            console.error("Load employees failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">Không thể tải danh sách nhân viên.</td>
                </tr>`;
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách nhân viên.");
        }
    };

    page.resetFilters = function resetFilters() {
        page.elements.keyword.value = "";
        page.elements.roleFilter.value = "";
        page.elements.adminFilter.value = "";
        page.elements.sortBy.value = "id";
        page.elements.sortDesc.value = "false";
        page.elements.itemsPerPage.value = "5";
        page.syncStateFromFilters(true);
        page.loadEmployees();
    };

    page.activateEmployee = async function activateEmployee(employeeId, trigger) {
        const employee = page.state.employees
            .map(page.normalizeEmployee)
            .find(item => item.id === employeeId);

        if (!employee || employee.active === 1 || !page.state.isHighestAdministrator) {
            return;
        }

        const activateButton = trigger instanceof HTMLElement ? trigger : null;
        if (activateButton) {
            activateButton.disabled = true;
        }

        try {
            const response = await apiClient.Put(window.appUrl(`/api/admin/employee/${employeeId}/activate`), {}, { showLoading: false });
            const isSuccess = response?.statusCode === 200
                || response?.statusCode === 201
                || response?.resultObj === true
                || response?.ResultObj === true;

            if (!isSuccess) {
                throw {
                    message: response?.message || response?.Message || "Không thể kích hoạt tài khoản.",
                    data: response
                };
            }

            page.state.employees = page.state.employees.map(item => {
                const currentId = Number(item?.id ?? item?.Id ?? 0);
                if (currentId !== employeeId) {
                    return item;
                }

                if (Object.prototype.hasOwnProperty.call(item, "active")) {
                    return { ...item, active: 1 };
                }

                return { ...item, Active: 1 };
            });

            page.renderRows(page.state.employees);
            page.notifier?.success(response?.message || response?.Message || "Kích hoạt tài khoản thành công.");
        } catch (error) {
            console.error("Activate employee failed:", error);
            page.notifier?.error(error?.data?.message || error?.data?.Message || error?.message || "Không thể kích hoạt tài khoản.");
        } finally {
            if (activateButton) {
                activateButton.disabled = false;
            }
        }
    };

    page.handleTableAction = function handleTableAction(event) {
        const trigger = event.target.closest("[data-action][data-id]");
        if (!trigger) {
            return;
        }

        const employeeId = Number(trigger.getAttribute("data-id"));
        const action = trigger.getAttribute("data-action");
        if (!employeeId || !action) {
            return;
        }

        if (action === "detail" && typeof page.openEmployeeDetail === "function") {
            page.openEmployeeDetail(employeeId);
        }

        if (action === "delete" && typeof page.openEmployeeDeleteModal === "function") {
            page.openEmployeeDeleteModal(employeeId);
        }

        if (action === "activate") {
            page.activateEmployee(employeeId, trigger);
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
        page.renderPagination(page.getFilteredEmployees().length);
        page.renderRows();
    };

    page.bindEvents = function bindEvents() {
        page.elements.searchButton.addEventListener("click", () => {
            page.syncStateFromFilters(true);
            page.loadEmployees();
        });

        page.elements.resetButton.addEventListener("click", page.resetFilters);
        page.elements.tableBody.addEventListener("click", page.handleTableAction);
        page.elements.pagination.addEventListener("click", page.handlePaginationClick);
        page.elements.itemsPerPage.addEventListener("change", () => {
            page.syncStateFromFilters(true);
            page.renderPagination(page.getFilteredEmployees().length);
            page.renderRows();
        });

        page.elements.keyword.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                page.syncStateFromFilters(true);
                page.loadEmployees();
            }
        });
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            page.resolveHighestAdministrator();
            await page.loadRoleOptions();
            page.syncStateFromFilters(true);
            page.bindEvents();
            await page.loadEmployees();
        } catch (error) {
            console.error("Employee page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn nhân viên.");
        }
    });
})();
