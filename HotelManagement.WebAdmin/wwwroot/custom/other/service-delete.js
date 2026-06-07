(() => {
    "use strict";

    const page = window.otherServicePage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.deleteModal = document.getElementById("serviceDeleteModal");
    page.elements.deleteTargetName = document.getElementById("serviceDeleteTargetName");
    page.elements.deleteConfirmButton = document.getElementById("serviceDeleteConfirmButton");

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

    page.openServiceDeleteModal = function openServiceDeleteModal(serviceId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        const service = page.state.services.find(item => Number(item?.id ?? item?.Id) === Number(serviceId)) || null;
        page.state.pendingDeleteId = Number(serviceId);
        page.elements.deleteTargetName.textContent = service?.nameService ?? service?.NameService ?? `#${serviceId}`;
        page.showModal(page.elements.deleteModal);
    };

    page.submitServiceDelete = async function submitServiceDelete() {
        if (page.state.isDeleting || !page.ensureAuthenticated()) {
            return;
        }

        if (!page.state.pendingDeleteId) {
            page.notifier?.error("Khong xac dinh duoc dich vu can xoa.");
            return;
        }

        page.state.isDeleting = true;
        page.elements.deleteConfirmButton.disabled = true;

        try {
            await apiClient.Delete(`${page.otherApiUrl}/services/${page.state.pendingDeleteId}`);
            page.hideModal(page.elements.deleteModal);
            page.notifier?.success("Xóa dịch vụ thành công.");
            page.state.pendingDeleteId = null;
            await page.loadServices();
        } catch (error) {
            console.error("Delete service failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể xóa dịch vụ.");
        } finally {
            page.state.isDeleting = false;
            page.elements.deleteConfirmButton.disabled = false;
        }
    };

    page.elements.deleteConfirmButton.addEventListener("click", page.submitServiceDelete);
})();
