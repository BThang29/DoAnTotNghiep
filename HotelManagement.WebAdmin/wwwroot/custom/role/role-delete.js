(() => {
    "use strict";

    const page = window.rolePage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.deleteModal = document.getElementById("roleDeleteModal");
    page.elements.deleteTargetName = document.getElementById("roleDeleteTargetName");
    page.elements.deleteConfirmButton = document.getElementById("roleDeleteConfirmButton");

    if (!page.elements.deleteModal || !page.elements.deleteTargetName || !page.elements.deleteConfirmButton) {
        return;
    }

    page.state.pendingDeleteId = null;
    page.state.isDeleting = false;

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

    page.openRoleDeleteModal = function openRoleDeleteModal(roleId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        const role = page.state.roles.find(item => Number(item?.id ?? item?.Id) === Number(roleId)) || null;
        page.state.pendingDeleteId = Number(roleId);
        page.elements.deleteTargetName.textContent = role?.name ?? role?.Name ?? `#${roleId}`;
        page.showModal(page.elements.deleteModal);
    };

    page.submitRoleDelete = async function submitRoleDelete() {
        if (page.state.isDeleting || !page.ensureAuthenticated()) {
            return;
        }

        if (!page.state.pendingDeleteId) {
            page.notifier?.error("Khong xac dinh duoc vai tro can xoa.");
            return;
        }

        page.state.isDeleting = true;
        page.elements.deleteConfirmButton.disabled = true;

        try {
            await apiClient.Delete(`${page.roleApiUrl}/${page.state.pendingDeleteId}`);
            page.hideModal(page.elements.deleteModal);
            page.notifier?.success("Xóa vai trò thành công.");
            page.state.pendingDeleteId = null;
            await page.loadRoles();
        } catch (error) {
            console.error("Delete role failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể xóa vai trò.");
        } finally {
            page.state.isDeleting = false;
            page.elements.deleteConfirmButton.disabled = false;
        }
    };

    page.elements.deleteConfirmButton.addEventListener("click", page.submitRoleDelete);
})();
