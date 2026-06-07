(() => {
    "use strict";

    const page = window.otherServicePage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.detailModal = document.getElementById("serviceDetailModal");
    page.elements.detailId = document.getElementById("serviceDetailId");
    page.elements.detailName = document.getElementById("serviceDetailName");
    page.elements.detailCode = document.getElementById("serviceDetailCode");
    page.elements.detailPrice = document.getElementById("serviceDetailPrice");
    page.elements.detailInventory = document.getElementById("serviceDetailInventory");
    page.elements.detailUnit = document.getElementById("serviceDetailUnit");
    page.elements.detailType = document.getElementById("serviceDetailType");
    page.elements.detailUpdateButton = document.getElementById("serviceDetailUpdateButton");

    if (Object.values({
        detailModal: page.elements.detailModal,
        detailId: page.elements.detailId,
        detailName: page.elements.detailName,
        detailCode: page.elements.detailCode,
        detailPrice: page.elements.detailPrice,
        detailInventory: page.elements.detailInventory,
        detailUnit: page.elements.detailUnit,
        detailType: page.elements.detailType,
        detailUpdateButton: page.elements.detailUpdateButton
    }).some(element => !element)) {
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

    page.renderDetailTypeOptions = function renderDetailTypeOptions() {
        page.elements.detailType.innerHTML = ['<option value="">Khong chon loai dich vu</option>']
            .concat(page.state.serviceTypes.map(item => `<option value="${item.id}">${item.name}</option>`))
            .join("");
    };

    page.fillDetailForm = function fillDetailForm(item) {
        page.renderDetailTypeOptions();
        page.elements.detailId.value = item?.id ?? item?.Id ?? "";
        page.elements.detailName.value = item?.nameService ?? item?.NameService ?? "";
        page.elements.detailCode.value = item?.serviceCode ?? item?.ServiceCode ?? "";
        page.elements.detailPrice.value = String(item?.price ?? item?.Price ?? "");
        page.elements.detailInventory.value = String(item?.remainingInventory ?? item?.RemainingInventory ?? "");
        page.elements.detailUnit.value = item?.unitName ?? item?.UnitName ?? "";
        page.elements.detailType.value = String(item?.serviceTypeId ?? item?.ServiceTypeId ?? "");
    };

    page.openServiceDetail = async function openServiceDetail(serviceId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            const response = await apiClient.Get(`${page.otherApiUrl}/services/${serviceId}`);
            page.fillDetailForm(page.getResultObject(response));
            page.showModal(page.elements.detailModal);
        } catch (error) {
            console.error("Load service detail failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải chi tiết dịch vụ.");
        }
    };

    page.buildDetailPayload = function buildDetailPayload() {
        const typeValue = page.elements.detailType.value;
        return {
            nameService: page.elements.detailName.value.trim(),
            price: page.elements.detailPrice.value === "" ? null : Number(page.elements.detailPrice.value),
            serviceCode: page.elements.detailCode.value.trim() || null,
            remainingInventory: page.elements.detailInventory.value === "" ? null : Number(page.elements.detailInventory.value),
            unitName: page.elements.detailUnit.value.trim() || null,
            serviceTypeId: typeValue === "" ? null : Number(typeValue)
        };
    };

    page.validateDetailPayload = function validateDetailPayload(payload) {
        if (!payload.nameService) {
            return "Ten dich vu khong duoc de trong.";
        }

        if (payload.price !== null && (!Number.isFinite(payload.price) || payload.price < 0)) {
            return "Gia dich vu khong hop le.";
        }

        if (payload.remainingInventory !== null && (!Number.isFinite(payload.remainingInventory) || payload.remainingInventory < 0)) {
            return "Ton kho khong hop le.";
        }

        return "";
    };

    page.submitServiceDetail = async function submitServiceDetail() {
        if (page.state.detailSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const serviceId = Number(page.elements.detailId.value);
        if (!serviceId) {
            page.notifier?.error("Khong xac dinh duoc dich vu can cap nhat.");
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
        page.elements.detailUpdateButton.disabled = true;

        try {
            await apiClient.Put(`${page.otherApiUrl}/services/${serviceId}`, payload);
            page.hideModal(page.elements.detailModal);
            page.notifier?.success("Cập nhật dịch vụ thành công.");
            await page.loadServices();
        } catch (error) {
            console.error("Update service failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể cập nhật dịch vụ.");
        } finally {
            page.state.detailSubmitting = false;
            page.elements.detailUpdateButton.disabled = false;
        }
    };

    page.elements.detailUpdateButton.addEventListener("click", page.submitServiceDetail);
})();
