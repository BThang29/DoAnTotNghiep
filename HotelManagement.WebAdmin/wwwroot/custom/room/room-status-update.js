(() => {
    "use strict";

    const page = window.roomPage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.statusModal = document.getElementById("roomStatusModal");
    page.elements.statusRoomId = document.getElementById("roomStatusRoomId");
    page.elements.statusTargetName = document.getElementById("roomStatusTargetName");
    page.elements.statusSelect = document.getElementById("roomStatusSelect");
    page.elements.statusUpdateButton = document.getElementById("roomStatusUpdateButton");

    if (!page.elements.statusModal
        || !page.elements.statusRoomId
        || !page.elements.statusTargetName
        || !page.elements.statusSelect
        || !page.elements.statusUpdateButton) {
        return;
    }

    page.state.statusSubmitting = false;

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

    page.renderStatusOptions = function renderStatusOptions(selectedId) {
        page.elements.statusSelect.innerHTML = page.state.roomStatuses
            .map(item => `<option value="${item.id}">${item.name}</option>`)
            .join("");

        page.elements.statusSelect.value = selectedId || "";
    };

    page.findRoomInList = function findRoomInList(roomId) {
        return page.state.rooms.find(item => Number(item?.id ?? item?.Id) === Number(roomId)) || null;
    };

    page.openRoomStatusModal = async function openRoomStatusModal(roomId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        let room = page.findRoomInList(roomId);

        if (!room) {
            try {
                const response = await apiClient.Get(`${page.roomApiUrl}/${roomId}`, { showLoading: false });
                room = page.getResultObject(response);
            } catch (error) {
                console.error("Load room detail for status failed:", error);
            }
        }

        page.elements.statusRoomId.value = String(roomId);
        page.elements.statusTargetName.textContent = room?.roomName ?? room?.RoomName ?? `#${roomId}`;
        page.renderStatusOptions(room?.roomStatusId ?? room?.RoomStatusId ?? "");
        page.showModal(page.elements.statusModal);
    };

    page.submitRoomStatusUpdate = async function submitRoomStatusUpdate() {
        if (page.state.statusSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const roomId = Number(page.elements.statusRoomId.value);
        const roomStatusId = page.elements.statusSelect.value;

        if (!roomId) {
            page.notifier?.error("Khong xac dinh duoc phong can cap nhat trang thai.");
            return;
        }

        if (!roomStatusId) {
            if (typeof page.notifier?.warning === "function") {
                page.notifier.warning("Vui lòng chọn trạng thái mới.");
            } else {
                page.notifier?.error?.("Vui lòng chọn trạng thái mới.");
            }
            return;
        }

        page.state.statusSubmitting = true;
        page.elements.statusUpdateButton.disabled = true;

        try {
            await apiClient.Put(`${page.roomApiUrl}/${roomId}/status`, { roomStatusId: roomStatusId });
            page.hideModal(page.elements.statusModal);
            page.notifier?.success("Cập nhật trạng thái phòng thành công.");
            await page.loadRooms();
        } catch (error) {
            console.error("Update room status failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể cập nhật trạng thái phòng.");
        } finally {
            page.state.statusSubmitting = false;
            page.elements.statusUpdateButton.disabled = false;
        }
    };

    page.elements.statusUpdateButton.addEventListener("click", page.submitRoomStatusUpdate);
})();
