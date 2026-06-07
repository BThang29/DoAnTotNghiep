(() => {
    "use strict";

    const page = window.rolePage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.createModal = document.getElementById("roleCreateModal");
    page.elements.createName = document.getElementById("roleCreateName");
    page.elements.createDescription = document.getElementById("roleCreateDescription");
    page.elements.createSubmitButton = document.getElementById("roleCreateSubmitButton");

    if (!page.elements.createModal || !page.elements.createName || !page.elements.createDescription || !page.elements.createSubmitButton) {
        return;
    }

    page.state.createSubmitting = false;

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

    page.openRoleCreateModal = function openRoleCreateModal() {
        page.elements.createName.value = "";
        page.elements.createDescription.value = "";
        page.showModal(page.elements.createModal);
    };

    page.submitRoleCreate = async function submitRoleCreate() {
        if (page.state.createSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const payload = {
            name: page.elements.createName.value.trim(),
            description: page.elements.createDescription.value.trim()
        };

        if (!payload.name) {
            if (typeof page.notifier?.warning === "function") {
                page.notifier.warning("Ten vai tro khong duoc de trong.");
            } else {
                page.notifier?.error?.("Ten vai tro khong duoc de trong.");
            }
            return;
        }

        page.state.createSubmitting = true;
        page.elements.createSubmitButton.disabled = true;

        try {
            await apiClient.Post(page.roleApiUrl, payload);
            page.hideModal(page.elements.createModal);
            page.notifier?.success("Tạo vai trò thành công.");
            await page.loadRoles();
        } catch (error) {
            console.error("Create role failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tạo vai trò.");
        } finally {
            page.state.createSubmitting = false;
            page.elements.createSubmitButton.disabled = false;
        }
    };

    page.elements.createSubmitButton.addEventListener("click", page.submitRoleCreate);
})();
