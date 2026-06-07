(() => {
    "use strict";

    const page = window.customerPage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.detailModal = document.getElementById("customerDetailModal");
    page.elements.detailId = document.getElementById("customerDetailId");
    page.elements.detailFullName = document.getElementById("customerDetailFullName");
    page.elements.detailIdentify = document.getElementById("customerDetailIdentify");
    page.elements.detailPhone = document.getElementById("customerDetailPhone");
    page.elements.detailMail = document.getElementById("customerDetailMail");
    page.elements.detailDob = document.getElementById("customerDetailDob");
    page.elements.detailTypeName = document.getElementById("customerDetailTypeName");
    page.elements.detailSaveButton = document.getElementById("customerDetailSaveButton");

    if (!page.elements.detailModal
        || !page.elements.detailId
        || !page.elements.detailFullName
        || !page.elements.detailIdentify
        || !page.elements.detailPhone
        || !page.elements.detailMail
        || !page.elements.detailDob
        || !page.elements.detailTypeName
        || !page.elements.detailSaveButton) {
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

    page.resetDetailForm = function resetDetailForm() {
        page.elements.detailId.value = "";
        page.elements.detailFullName.value = "";
        page.elements.detailIdentify.value = "";
        page.elements.detailPhone.value = "";
        page.elements.detailMail.value = "";
        page.elements.detailDob.value = "";
        page.elements.detailTypeName.textContent = "-";
    };

    page.fillDetailForm = function fillDetailForm(item) {
        page.elements.detailId.value = item?.id ?? item?.Id ?? "";
        page.elements.detailFullName.value = item?.fullName ?? item?.FullName ?? "";
        page.elements.detailIdentify.value = item?.identify ?? item?.Identify ?? "";
        page.elements.detailPhone.value = item?.phone ?? item?.Phone ?? "";
        page.elements.detailMail.value = item?.mail ?? item?.Mail ?? "";
        page.elements.detailDob.value = page.toDateInputValue(item?.dob ?? item?.Dob ?? item?.dobStr ?? item?.DobStr);
        page.elements.detailTypeName.textContent = item?.customerTypeName ?? item?.CustomerTypeName ?? "-";
    };

    page.openCustomerDetail = async function openCustomerDetail(customerId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.resetDetailForm();

        try {
            const response = await apiClient.Get(`${page.customerApiUrl}/${customerId}`);
            const item = page.getResultObject(response);
            page.fillDetailForm(item);
            page.showModal(page.elements.detailModal);
        } catch (error) {
            console.error("Load customer detail failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải chi tiết khách hàng.");
        }
    };

    page.buildDetailPayload = function buildDetailPayload() {
        return {
            fullName: page.elements.detailFullName.value.trim(),
            identify: page.elements.detailIdentify.value.trim() || null,
            phone: page.elements.detailPhone.value.trim() || null,
            mail: page.elements.detailMail.value.trim() || null,
            dob: page.elements.detailDob.value || null
        };
    };

    page.validateDetailPayload = function validateDetailPayload(payload) {
        if (!payload.fullName) {
            return "Ten khach hang khong duoc de trong.";
        }

        return "";
    };

    page.submitCustomerDetail = async function submitCustomerDetail() {
        if (page.state.detailSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const customerId = Number(page.elements.detailId.value);
        if (!customerId) {
            page.notifier?.error("Khong xac dinh duoc khach hang can cap nhat.");
            return;
        }

        const payload = page.buildDetailPayload();
        const validationMessage = page.validateDetailPayload(payload);
        if (validationMessage) {
            if (typeof page.notifier?.warning === "function") {
                page.notifier.warning(validationMessage);
            } else {
                page.notifier?.error?.(validationMessage);
            }
            return;
        }

        page.state.detailSubmitting = true;
        page.elements.detailSaveButton.disabled = true;

        try {
            await apiClient.Put(`${page.customerApiUrl}/${customerId}`, payload);
            page.hideModal(page.elements.detailModal);
            page.notifier?.success("Cập nhật khách hàng thành công.");
            await page.loadCustomers();
        } catch (error) {
            console.error("Update customer failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể cập nhật khách hàng.");
        } finally {
            page.state.detailSubmitting = false;
            page.elements.detailSaveButton.disabled = false;
        }
    };

    page.elements.detailSaveButton.addEventListener("click", page.submitCustomerDetail);
})();
