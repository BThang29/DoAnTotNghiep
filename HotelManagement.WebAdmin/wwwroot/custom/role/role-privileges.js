(() => {
    "use strict";

    const page = window.rolePage;
    if (!page || !window.apiClient) {
        return;
    }

    const privilegeCatalog = [
        { id: "ViewUser", description: "Xem người dùng", group: "Người dùng" },
        { id: "ManageUser", description: "Quản lý người dùng", group: "Người dùng" },
        { id: "ViewRole", description: "Xem nhóm người dùng", group: "Vai trò" },
        { id: "ManageRole", description: "Quản lý nhóm người dùng", group: "Vai trò" },
        { id: "ViewEmployee", description: "Xem nhân viên", group: "Nhân viên" },
        { id: "ManageEmployee", description: "Quản lý nhân viên", group: "Nhân viên" },
        { id: "ViewCustomer", description: "Xem khách hàng", group: "Khách hàng" },
        { id: "ManageCustomer", description: "Quản lý khách hàng", group: "Khách hàng" },
        { id: "ViewRoom", description: "Xem phòng", group: "Phòng" },
        { id: "ManageRoom", description: "Quản lý phòng", group: "Phòng" },
        { id: "ViewBooking", description: "Xem đặt phòng", group: "Đặt phòng" },
        { id: "ManageBooking", description: "Quản lý đặt phòng", group: "Đặt phòng" },
        { id: "CheckIn", description: "Nhận phòng", group: "Đặt phòng" },
        { id: "CheckOut", description: "Trả phòng", group: "Đặt phòng" },
        { id: "ViewInvoice", description: "Xem hóa đơn", group: "Hóa đơn" },
        { id: "ManageInvoice", description: "Quản lý hóa đơn", group: "Hóa đơn" },
        { id: "CreateInvoice", description: "Tạo hóa đơn", group: "Hóa đơn" },
        { id: "ViewPayment", description: "Xem thanh toán", group: "Thanh toán" },
        { id: "ManagePayment", description: "Quản lý thanh toán", group: "Thanh toán" },
        { id: "ViewService", description: "Xem dịch vụ", group: "Dịch vụ" },
        { id: "ManageService", description: "Quản lý dịch vụ", group: "Dịch vụ" },
        { id: "UpdateServiceUsage", description: "Cập nhật sử dụng dịch vụ", group: "Dịch vụ" },
        { id: "ViewCustomerSupport", description: "Xem hỗ trợ khách hàng", group: "Hỗ trợ" },
        { id: "ViewDashboard", description: "Xem dashboard", group: "Báo cáo" },
        { id: "ViewReport", description: "Xem báo cáo", group: "Báo cáo" },
        { id: "ViewRevenueReport", description: "Xem báo cáo doanh thu", group: "Báo cáo" },
        { id: "ExportFinancialReport", description: "Xuất báo cáo tài chính", group: "Báo cáo" },
        { id: "RegisterAccount", description: "Đăng ký tài khoản", group: "Tài khoản" },
        { id: "LoginAccount", description: "Đăng nhập", group: "Tài khoản" },
        { id: "ViewRoomPrice", description: "Xem giá phòng", group: "Phòng" },
        { id: "CreateBooking", description: "Tạo đặt phòng", group: "Đặt phòng" },
        { id: "OnlinePayment", description: "Thanh toán online", group: "Thanh toán" },
        { id: "ViewBookingHistory", description: "Xem lịch sử đặt phòng", group: "Đặt phòng" },
        { id: "SubmitFeedback", description: "Gửi phản hồi", group: "Khách hàng" }
    ];

    page.elements.privilegeModal = document.getElementById("rolePrivilegeModal");
    page.elements.privilegeRoleId = document.getElementById("rolePrivilegeRoleId");
    page.elements.privilegeTargetName = document.getElementById("rolePrivilegeTargetName");
    page.elements.privilegeGroups = document.getElementById("rolePrivilegeGroups");
    page.elements.privilegeSaveButton = document.getElementById("rolePrivilegeSaveButton");

    if (!page.elements.privilegeModal || !page.elements.privilegeRoleId || !page.elements.privilegeTargetName || !page.elements.privilegeGroups || !page.elements.privilegeSaveButton) {
        return;
    }

    page.state.privilegeSubmitting = false;

    page.showModal = page.showModal || function showModal(modalElement) {
        if (window.jQuery && typeof window.jQuery.fn.modal === "function") {
            window.jQuery(modalElement).modal("show");
        }
    };

    page.hideModal = page.hideModal || function hideModal(modalElement) {
        if (window.jQuery && typeof window.jQuery.fn.modal === "function") {
            window.jQuery(modalElement).modal("hide");
        }
    };

    page.renderPrivilegeGroups = function renderPrivilegeGroups(selectedPrivileges) {
        const selectedSet = new Set(selectedPrivileges || []);
        const groups = privilegeCatalog.reduce((result, item) => {
            if (!result[item.group]) {
                result[item.group] = [];
            }

            result[item.group].push(item);
            return result;
        }, {});

        page.elements.privilegeGroups.innerHTML = Object.keys(groups).map(groupName => `
            <div class="col-lg-6 mb-3">
                <div class="role-privilege-group">
                    <div class="role-privilege-group-title">${page.escapeHtml(groupName)}</div>
                    ${groups[groupName].map(item => `
                        <label class="role-privilege-option">
                            <input type="checkbox" class="mt-1 role-privilege-checkbox" value="${item.id}" ${selectedSet.has(item.id) ? "checked" : ""}>
                            <span>
                                <div class="role-privilege-label">${page.escapeHtml(item.id)}</div>
                                <div class="role-privilege-description">${page.escapeHtml(item.description)}</div>
                            </span>
                        </label>
                    `).join("")}
                </div>
            </div>
        `).join("");
    };

    page.getSelectedPrivileges = function getSelectedPrivileges() {
        return Array.from(page.elements.privilegeGroups.querySelectorAll(".role-privilege-checkbox:checked"))
            .map(element => element.value)
            .filter(Boolean);
    };

    page.openRolePrivileges = async function openRolePrivileges(roleId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        const role = page.state.roles.find(item => Number(item?.id ?? item?.Id) === Number(roleId)) || null;

        try {
            const response = await apiClient.Get(`${page.roleApiUrl}/${roleId}/privileges`);
            const privileges = page.getResultObject(response);
            page.elements.privilegeRoleId.value = String(roleId);
            page.elements.privilegeTargetName.textContent = role?.name ?? role?.Name ?? `#${roleId}`;
            page.renderPrivilegeGroups(Array.isArray(privileges) ? privileges : []);
            page.showModal(page.elements.privilegeModal);
        } catch (error) {
            console.error("Load role privileges failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách quyền.");
        }
    };

    page.submitRolePrivileges = async function submitRolePrivileges() {
        if (page.state.privilegeSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const roleId = Number(page.elements.privilegeRoleId.value);
        if (!roleId) {
            page.notifier?.error("Khong xac dinh duoc vai tro can phan quyen.");
            return;
        }

        const payload = {
            id: roleId,
            privileges: page.getSelectedPrivileges()
        };

        page.state.privilegeSubmitting = true;
        page.elements.privilegeSaveButton.disabled = true;

        try {
            await apiClient.Put(`${page.roleApiUrl}/${roleId}/saveroles`, payload);
            page.hideModal(page.elements.privilegeModal);
            page.notifier?.success("Luu phan quyen thanh cong.");
            await page.loadRoles();
        } catch (error) {
            console.error("Save role privileges failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể lưu phân quyền.");
        } finally {
            page.state.privilegeSubmitting = false;
            page.elements.privilegeSaveButton.disabled = false;
        }
    };

    page.elements.privilegeSaveButton.addEventListener("click", page.submitRolePrivileges);
})();
