(() => {
    "use strict";

    const page = {
        customerApiUrl: window.appUrl("/api/admin/customer"),
        notifier: window.appNotifier,
        elements: {
            fullName: document.getElementById("customerCreateFullName"),
            identify: document.getElementById("customerCreateIdentify"),
            phone: document.getElementById("customerCreatePhone"),
            mail: document.getElementById("customerCreateMail"),
            dob: document.getElementById("customerCreateDob"),
            type: document.getElementById("customerCreateType"),
            submitButton: document.getElementById("customerCreateSubmitButton")
        },
        state: {
            customerTypes: [],
            isSubmitting: false,
            lastDobValidationValue: "",
            lastDobValidationMessage: ""
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

    page.parseInputDate = function parseInputDate(value) {
        const trimmedValue = String(value || "").trim();
        if (!trimmedValue) {
            return null;
        }

        const match = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            return null;
        }

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const parsedDate = new Date(year, month - 1, day);

        if (Number.isNaN(parsedDate.getTime())
            || parsedDate.getFullYear() !== year
            || parsedDate.getMonth() !== month - 1
            || parsedDate.getDate() !== day) {
            return null;
        }

        parsedDate.setHours(0, 0, 0, 0);
        return parsedDate;
    };

    page.validateDobValue = function validateDobValue(value) {
        const trimmedValue = String(value || "").trim();
        if (!trimmedValue) {
            return "";
        }

        const dob = page.parseInputDate(trimmedValue);
        if (!dob) {
            return "Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng yyyy-mm-dd.";
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dob.getFullYear() > today.getFullYear()) {
            return "Nam sinh khong duoc lon hon nam hien tai.";
        }

        const minimumAdultDob = new Date(today);
        minimumAdultDob.setFullYear(minimumAdultDob.getFullYear() - 18);

        if (dob > minimumAdultDob) {
            return "Khách hàng phải đủ 18 tuổi trở lên.";
        }

        return "";
    };

    page.notifyDobValidation = function notifyDobValidation() {
        const currentDobValue = String(page.elements.dob.value || "").trim();
        const validationMessage = page.validateDobValue(currentDobValue);
        if (!validationMessage) {
            page.state.lastDobValidationValue = currentDobValue;
            page.state.lastDobValidationMessage = "";
            return "";
        }

        if (page.state.lastDobValidationValue === currentDobValue
            && page.state.lastDobValidationMessage === validationMessage) {
            return validationMessage;
        }

        page.state.lastDobValidationValue = currentDobValue;
        page.state.lastDobValidationMessage = validationMessage;

        if (typeof page.notifier?.warning === "function") {
            page.notifier.warning(validationMessage);
        } else {
            page.notifier?.error?.(validationMessage);
        }

        return validationMessage;
    };

    page.renderOptions = function renderOptions(element, items, placeholder) {
        element.innerHTML = [`<option value="">${placeholder}</option>`]
            .concat(items.map(item => `<option value="${item.id}">${item.name}</option>`))
            .join("");
    };

    page.loadLookups = async function loadLookups() {
        const response = await apiClient.Get(`${page.customerApiUrl}/types`, { showLoading: false });
        page.state.customerTypes = (page.getResultObject(response) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.name ?? item?.Name ?? ""
        }));

        page.renderOptions(page.elements.type, page.state.customerTypes, "Chọn loại khách hàng");
    };

    page.buildPayload = function buildPayload() {
        return {
            fullName: page.elements.fullName.value.trim(),
            identify: page.elements.identify.value.trim() || null,
            phone: page.elements.phone.value.trim() || null,
            mail: page.elements.mail.value.trim() || null,
            dob: page.elements.dob.value || null,
            customer_Type: page.elements.type.value ? Number(page.elements.type.value) : null
        };
    };

    page.validatePayload = function validatePayload(payload) {
        if (!payload.fullName) {
            return "Ten khach hang khong duoc de trong.";
        }

        const dobValidationMessage = page.validateDobValue(payload.dob);
        if (dobValidationMessage) {
            return dobValidationMessage;
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
            await apiClient.Post(page.customerApiUrl, payload);
            page.notifier?.redirectWithNotification("/Customer/Customers", "Tạo khách hàng thành công.", "success");
        } catch (error) {
            console.error("Create customer failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tạo khách hàng.");
        } finally {
            page.state.isSubmitting = false;
            page.elements.submitButton.disabled = false;
        }
    };

    page.bindEvents = function bindEvents() {
        page.elements.submitButton.addEventListener("click", page.submit);

        [page.elements.fullName, page.elements.identify, page.elements.phone, page.elements.mail, page.elements.dob].forEach(element => {
            element.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    page.submit();
                }
            });
        });

        ["change", "blur"].forEach(eventName => {
            page.elements.dob.addEventListener(eventName, page.notifyDobValidation);
        });
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            await page.loadLookups();
            page.bindEvents();
        } catch (error) {
            console.error("Create customer page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn tạo khách hàng.");
        }
    });
})();
