(() => {
    "use strict";

    const page = window.roomPage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.detailModal = document.getElementById("roomDetailModal");
    page.elements.detailId = document.getElementById("roomDetailId");
    page.elements.detailName = document.getElementById("roomDetailName");
    page.elements.detailPrice = document.getElementById("roomDetailPrice");
    page.elements.detailType = document.getElementById("roomDetailType");
    page.elements.detailStatus = document.getElementById("roomDetailStatus");
    page.elements.detailUpdateButton = document.getElementById("roomDetailUpdateButton");

    if (!page.elements.detailModal
        || !page.elements.detailId
        || !page.elements.detailName
        || !page.elements.detailPrice
        || !page.elements.detailType
        || !page.elements.detailStatus
        || !page.elements.detailUpdateButton) {
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

    page.renderDetailOptions = function renderDetailOptions() {
        page.elements.detailType.innerHTML = page.state.roomTypes
            .map(item => `<option value="${item.id}">${item.name}</option>`)
            .join("");

        page.elements.detailStatus.innerHTML = page.state.roomStatuses
            .map(item => `<option value="${item.id}">${item.name}</option>`)
            .join("");
    };

    page.resetDetailForm = function resetDetailForm() {
        page.elements.detailId.value = "";
        page.elements.detailName.value = "";
        page.elements.detailPrice.value = "";
        page.elements.detailType.value = "";
        page.elements.detailStatus.value = "";
    };

    page.fillDetailForm = function fillDetailForm(item) {
        page.renderDetailOptions();
        page.elements.detailId.value = item?.id ?? item?.Id ?? "";
        page.elements.detailName.value = item?.roomName ?? item?.RoomName ?? "";
        page.elements.detailPrice.value = String(item?.price ?? item?.Price ?? "");
        page.elements.detailType.value = item?.roomTypeId ?? item?.RoomTypeId ?? "";
        page.elements.detailStatus.value = item?.roomStatusId ?? item?.RoomStatusId ?? "";
    };

    page.openRoomDetail = async function openRoomDetail(roomId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.resetDetailForm();
        page.renderDetailOptions();

        try {
            const response = await apiClient.Get(`${page.roomApiUrl}/${roomId}`);
            const item = page.getResultObject(response);
            page.fillDetailForm(item);
            page.showModal(page.elements.detailModal);
        } catch (error) {
            console.error("Load room detail failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải chi tiết phòng.");
        }
    };

    page.buildDetailPayload = function buildDetailPayload() {
        return {
            roomName: page.elements.detailName.value.trim(),
            price: Number(page.elements.detailPrice.value),
            roomTypeId: page.elements.detailType.value,
            roomStatusId: page.elements.detailStatus.value
        };
    };

    page.validateDetailPayload = function validateDetailPayload(payload) {
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

    page.submitRoomDetail = async function submitRoomDetail() {
        if (page.state.detailSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const roomId = Number(page.elements.detailId.value);
        if (!roomId) {
            page.notifier?.error("Khong xac dinh duoc phong can cap nhat.");
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
            await apiClient.Put(`${page.roomApiUrl}/${roomId}`, payload);
            page.hideModal(page.elements.detailModal);
            page.notifier?.success("Cập nhật phòng thành công.");
            await page.loadRooms();
        } catch (error) {
            console.error("Update room failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể cập nhật phòng.");
        } finally {
            page.state.detailSubmitting = false;
            page.elements.detailUpdateButton.disabled = false;
        }
    };

    page.elements.detailUpdateButton.addEventListener("click", page.submitRoomDetail);
})();
