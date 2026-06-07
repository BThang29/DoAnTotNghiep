(() => {
    "use strict";

    const page = {
        otherApiUrl: window.appUrl("/api/admin/other"),
        notifier: window.appNotifier,
        elements: {
            name: document.getElementById("serviceCreateName"),
            code: document.getElementById("serviceCreateCode"),
            price: document.getElementById("serviceCreatePrice"),
            inventory: document.getElementById("serviceCreateInventory"),
            unit: document.getElementById("serviceCreateUnit"),
            type: document.getElementById("serviceCreateType"),
            submitButton: document.getElementById("serviceCreateSubmitButton")
        },
        state: {
            serviceTypes: [],
            isSubmitting: false
        }
    };

    if (!window.apiClient || Object.values(page.elements).some(element => !element)) {
        return;
    }

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

    page.renderOptions = function renderOptions(element, items, placeholder) {
        element.innerHTML = [`<option value="">${placeholder}</option>`]
            .concat(items.map(item => `<option value="${item.id}">${item.name}</option>`))
            .join("");
    };

    page.loadServiceTypes = async function loadServiceTypes() {
        const response = await apiClient.Get(`${page.otherApiUrl}/service-types`, { showLoading: false });
        page.state.serviceTypes = (page.getResultObject(response) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.name ?? item?.Name ?? ""
        }));
        page.renderOptions(page.elements.type, page.state.serviceTypes, "Chọn loại dịch vụ");
    };

    page.buildPayload = function buildPayload() {
        const serviceTypeValue = page.elements.type.value;
        return {
            nameService: page.elements.name.value.trim(),
            price: page.elements.price.value === "" ? null : Number(page.elements.price.value),
            serviceCode: page.elements.code.value.trim() || null,
            remainingInventory: page.elements.inventory.value === "" ? null : Number(page.elements.inventory.value),
            unitName: page.elements.unit.value.trim() || null,
            serviceTypeId: serviceTypeValue === "" ? null : Number(serviceTypeValue)
        };
    };

    page.validatePayload = function validatePayload(payload) {
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

    page.submit = async function submit() {
        if (page.state.isSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const payload = page.buildPayload();
        const validationMessage = page.validatePayload(payload);
        if (validationMessage) {
            if (typeof page.notifier?.warning === "function") {
                page.notifier.warning(validationMessage);
            } else {
                page.notifier?.error?.(validationMessage);
            }
            return;
        }

        page.state.isSubmitting = true;
        page.elements.submitButton.disabled = true;

        try {
            await apiClient.Post(`${page.otherApiUrl}/services`, payload);
            page.notifier?.redirectWithNotification("/Other/Services", "Tạo dịch vụ thành công.", "success");
        } catch (error) {
            console.error("Create service failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tạo dịch vụ.");
        } finally {
            page.state.isSubmitting = false;
            page.elements.submitButton.disabled = false;
        }
    };

    page.bindEvents = function bindEvents() {
        page.elements.submitButton.addEventListener("click", page.submit);
        [page.elements.name, page.elements.code, page.elements.price, page.elements.inventory, page.elements.unit].forEach(element => {
            element.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    page.submit();
                }
            });
        });
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadServiceTypes();
            page.bindEvents();
        } catch (error) {
            console.error("Create service page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn tạo dịch vụ.");
        }
    });
})();
