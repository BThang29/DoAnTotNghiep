(() => {
    "use strict";

    const page = window.employeePage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.deleteModal = document.getElementById("employeeDeleteModal");
    page.elements.deleteTargetName = document.getElementById("employeeDeleteTargetName");
    page.elements.deleteConfirmButton = document.getElementById("employeeDeleteConfirmButton");

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

    page.openEmployeeDeleteModal = function openEmployeeDeleteModal(employeeId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        const employee = page.state.employees
            .map(page.normalizeEmployee)
            .find(item => Number(item.id) === Number(employeeId)) || null;

        page.state.pendingDeleteId = Number(employeeId);
        page.elements.deleteTargetName.textContent = employee?.fullName || employee?.userName || `#${employeeId}`;
        page.showModal(page.elements.deleteModal);
    };

    page.submitEmployeeDelete = async function submitEmployeeDelete() {
        if (page.state.isDeleting || !page.ensureAuthenticated()) {
            return;
        }

        if (!page.state.pendingDeleteId) {
            page.notifier?.error("Khong xac dinh duoc nhan vien can xoa.");
            return;
        }

        page.state.isDeleting = true;
        page.elements.deleteConfirmButton.disabled = true;

        try {
            await apiClient.Delete(`${page.employeeApiUrl}/${page.state.pendingDeleteId}`);
            page.hideModal(page.elements.deleteModal);
            page.notifier?.success("Xóa nhân viên thành công.");
            page.state.pendingDeleteId = null;
            await page.loadEmployees();
        } catch (error) {
            console.error("Delete employee failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể xóa nhân viên.");
        } finally {
            page.state.isDeleting = false;
            page.elements.deleteConfirmButton.disabled = false;
        }
    };

    page.elements.deleteConfirmButton.addEventListener("click", page.submitEmployeeDelete);
})();
