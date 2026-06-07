(() => {
    "use strict";

    const page = window.customerPage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.deleteModal = document.getElementById("customerDeleteModal");
    page.elements.deleteTargetName = document.getElementById("customerDeleteTargetName");
    page.elements.deleteConfirmButton = document.getElementById("customerDeleteConfirmButton");

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

    page.openCustomerDeleteModal = function openCustomerDeleteModal(customerId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        const customer = page.state.customers.find(item => Number(item?.id ?? item?.Id) === Number(customerId)) || null;
        page.state.pendingDeleteId = Number(customerId);
        page.elements.deleteTargetName.textContent = customer?.fullName ?? customer?.FullName ?? `#${customerId}`;
        page.showModal(page.elements.deleteModal);
    };

    page.submitCustomerDelete = async function submitCustomerDelete() {
        if (page.state.isDeleting || !page.ensureAuthenticated()) {
            return;
        }

        if (!page.state.pendingDeleteId) {
            page.notifier?.error("Khong xac dinh duoc khach hang can xoa.");
            return;
        }

        page.state.isDeleting = true;
        page.elements.deleteConfirmButton.disabled = true;

        try {
            await apiClient.Delete(`${page.customerApiUrl}/${page.state.pendingDeleteId}`);
            page.hideModal(page.elements.deleteModal);
            page.notifier?.success("Xóa khách hàng thành công.");
            page.state.pendingDeleteId = null;
            await page.loadCustomers();
        } catch (error) {
            console.error("Delete customer failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể xóa khách hàng.");
        } finally {
            page.state.isDeleting = false;
            page.elements.deleteConfirmButton.disabled = false;
        }
    };

    page.elements.deleteConfirmButton.addEventListener("click", page.submitCustomerDelete);
})();
