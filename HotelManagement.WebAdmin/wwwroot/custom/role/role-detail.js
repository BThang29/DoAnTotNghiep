(() => {
    "use strict";

    const page = window.rolePage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.detailModal = document.getElementById("roleDetailModal");
    page.elements.detailId = document.getElementById("roleDetailId");
    page.elements.detailName = document.getElementById("roleDetailName");
    page.elements.detailDescription = document.getElementById("roleDetailDescription");
    page.elements.detailSaveButton = document.getElementById("roleDetailSaveButton");

    if (!page.elements.detailModal || !page.elements.detailId || !page.elements.detailName || !page.elements.detailDescription || !page.elements.detailSaveButton) {
        return;
    }

    page.state.detailSubmitting = false;

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

    page.openRoleDetail = async function openRoleDetail(roleId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            const response = await apiClient.Get(`${page.roleApiUrl}/${roleId}`);
            const item = page.getResultObject(response);
            page.elements.detailId.value = item?.id ?? item?.Id ?? "";
            page.elements.detailName.value = item?.name ?? item?.Name ?? "";
            page.elements.detailDescription.value = item?.description ?? item?.Description ?? "";
            page.showModal(page.elements.detailModal);
        } catch (error) {
            console.error("Load role detail failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải chi tiết vai trò.");
        }
    };

    page.submitRoleDetail = async function submitRoleDetail() {
        if (page.state.detailSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const roleId = Number(page.elements.detailId.value);
        const payload = {
            name: page.elements.detailName.value.trim(),
            description: page.elements.detailDescription.value.trim()
        };

        if (!roleId) {
            page.notifier?.error("Khong xac dinh duoc vai tro can cap nhat.");
            return;
        }

        if (!payload.name) {
            if (typeof page.notifier?.warning === "function") {
                page.notifier.warning("Ten vai tro khong duoc de trong.");
            } else {
                page.notifier?.error?.("Ten vai tro khong duoc de trong.");
            }
            return;
        }

        page.state.detailSubmitting = true;
        page.elements.detailSaveButton.disabled = true;

        try {
            await apiClient.Put(`${page.roleApiUrl}/${roleId}`, payload);
            page.hideModal(page.elements.detailModal);
            page.notifier?.success("Cập nhật vai trò thành công.");
            await page.loadRoles();
        } catch (error) {
            console.error("Update role failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể cập nhật vai trò.");
        } finally {
            page.state.detailSubmitting = false;
            page.elements.detailSaveButton.disabled = false;
        }
    };

    page.elements.detailSaveButton.addEventListener("click", page.submitRoleDetail);
})();
