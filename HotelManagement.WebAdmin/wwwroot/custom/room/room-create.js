(() => {
    "use strict";

    const page = {
        roomApiUrl: window.appUrl("/api/admin/room"),
        notifier: window.appNotifier,
        elements: {
            name: document.getElementById("roomCreateName"),
            price: document.getElementById("roomCreatePrice"),
            type: document.getElementById("roomCreateType"),
            status: document.getElementById("roomCreateStatus"),
            submitButton: document.getElementById("roomCreateSubmitButton")
        },
        state: {
            roomTypes: [],
            roomStatuses: [],
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

    page.loadLookups = async function loadLookups() {
        const [typesResponse, statusesResponse] = await Promise.all([
            apiClient.Get(`${page.roomApiUrl}/types`, { showLoading: false }),
            apiClient.Get(`${page.roomApiUrl}/statuses`, { showLoading: false })
        ]);

        page.state.roomTypes = (page.getResultObject(typesResponse) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.name ?? item?.Name ?? ""
        }));

        page.state.roomStatuses = (page.getResultObject(statusesResponse) || []).map(item => ({
            id: item?.id ?? item?.Id ?? "",
            name: item?.name ?? item?.Name ?? ""
        }));

        page.renderOptions(page.elements.type, page.state.roomTypes, "Chọn loại phòng");
        page.renderOptions(page.elements.status, page.state.roomStatuses, "Chọn trạng thái");
    };

    page.buildPayload = function buildPayload() {
        return {
            roomName: page.elements.name.value.trim(),
            price: Number(page.elements.price.value),
            roomTypeId: page.elements.type.value,
            roomStatusId: page.elements.status.value
        };
    };

    page.validatePayload = function validatePayload(payload) {
        if (!payload.roomName) {
            return "Ten phong khong duoc de trong.";
        }

        if (!Number.isFinite(payload.price) || payload.price < 0) {
            return "Gia phong khong hop le.";
        }

        if (!payload.roomTypeId) {
            return "Vui lòng chọn loại phòng.";
        }

        if (!payload.roomStatusId) {
            return "Vui lòng chọn trạng thái phòng.";
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
            await apiClient.Post(page.roomApiUrl, payload);
            page.notifier?.redirectWithNotification("/Room/Rooms", "Tạo phòng thành công.", "success");
        } catch (error) {
            console.error("Create room failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tạo phòng.");
        } finally {
            page.state.isSubmitting = false;
            page.elements.submitButton.disabled = false;
        }
    };

    page.bindEvents = function bindEvents() {
        page.elements.submitButton.addEventListener("click", page.submit);
        [page.elements.name, page.elements.price].forEach(element => {
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
            await page.loadLookups();
            page.bindEvents();
        } catch (error) {
            console.error("Create room page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn tạo phòng.");
        }
    });
})();
