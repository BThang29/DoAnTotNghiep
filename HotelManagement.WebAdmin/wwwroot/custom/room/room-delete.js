(() => {
    "use strict";

    const page = window.roomPage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.deleteModal = document.getElementById("roomDeleteModal");
    page.elements.deleteTargetName = document.getElementById("roomDeleteTargetName");
    page.elements.deleteConfirmButton = document.getElementById("roomDeleteConfirmButton");

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

    page.openRoomDeleteModal = function openRoomDeleteModal(roomId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        const room = page.state.rooms.find(item => Number(item?.id ?? item?.Id) === Number(roomId)) || null;
        page.state.pendingDeleteId = Number(roomId);
        page.elements.deleteTargetName.textContent = room?.roomName ?? room?.RoomName ?? `#${roomId}`;
        page.showModal(page.elements.deleteModal);
    };

    page.submitRoomDelete = async function submitRoomDelete() {
        if (page.state.isDeleting || !page.ensureAuthenticated()) {
            return;
        }

        if (!page.state.pendingDeleteId) {
            page.notifier?.error("Khong xac dinh duoc phong can xoa.");
            return;
        }

        page.state.isDeleting = true;
        page.elements.deleteConfirmButton.disabled = true;

        try {
            await apiClient.Delete(`${page.roomApiUrl}/${page.state.pendingDeleteId}`);
            page.hideModal(page.elements.deleteModal);
            page.notifier?.success("Xóa phòng thành công.");
            page.state.pendingDeleteId = null;
            await page.loadRooms();
        } catch (error) {
            console.error("Delete room failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể xóa phòng.");
        } finally {
            page.state.isDeleting = false;
            page.elements.deleteConfirmButton.disabled = false;
        }
    };

    page.elements.deleteConfirmButton.addEventListener("click", page.submitRoomDelete);
})();
