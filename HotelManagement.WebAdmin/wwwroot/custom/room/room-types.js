(() => {
    "use strict";

    const page = {
        roomApiUrl: window.appUrl("/api/admin/room"),
        notifier: window.appNotifier,
        elements: {
            openCreateButton: document.getElementById("roomTypeOpenCreateButton"),
            summary: document.getElementById("roomTypeSummary"),
            tableBody: document.getElementById("roomTypeTableBody"),
            formModal: document.getElementById("roomTypeFormModal"),
            formKicker: document.getElementById("roomTypeFormKicker"),
            originalId: document.getElementById("roomTypeOriginalId"),
            typeId: document.getElementById("roomTypeId"),
            typeName: document.getElementById("roomTypeName"),
            submitButton: document.getElementById("roomTypeSubmitButton"),
            deleteModal: document.getElementById("roomTypeDeleteModal"),
            deleteTarget: document.getElementById("roomTypeDeleteTarget"),
            deleteButton: document.getElementById("roomTypeDeleteButton")
        },
        state: {
            roomTypes: [],
            editingId: "",
            deletingId: "",
            isSubmitting: false,
            isDeleting: false
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

    page.showModal = function showModal(modalElement) {
        if (window.jQuery && typeof window.jQuery.fn.modal === "function") {
            window.jQuery(modalElement).modal("show");
        }
    };

    page.hideModal = function hideModal(modalElement) {
        if (window.jQuery && typeof window.jQuery.fn.modal === "function") {
            window.jQuery(modalElement).modal("hide");
        }
    };

    page.renderLoading = function renderLoading() {
        page.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
        page.elements.summary.textContent = "Đang tải dữ liệu...";
    };

    page.renderRows = function renderRows(items) {
        page.state.roomTypes = Array.isArray(items) ? items : [];
        page.elements.summary.textContent = `Tong ${page.state.roomTypes.length} loai phong`;

        if (page.state.roomTypes.length === 0) {
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted">Chua co loai phong nao.</td>
                </tr>`;
            return;
        }

        page.elements.tableBody.innerHTML = page.state.roomTypes.map(item => {
            const id = item?.id ?? item?.Id ?? "";
            const name = item?.name ?? item?.Name ?? "";
            return `
                <tr>
                    <td>${id}</td>
                    <td>${name || "-"}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-primary btn-sm" data-action="edit" data-id="${id}" title="Sua">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${id}" title="Xoa">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        }).join("");
    };

    page.loadRoomTypes = async function loadRoomTypes() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.renderLoading();

        try {
            const response = await apiClient.Get(`${page.roomApiUrl}/types`);
            page.renderRows(page.getResultObject(response) || []);
        } catch (error) {
            console.error("Load room types failed:", error);
            page.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-danger">Không thể tải danh sách loại phòng.</td>
                </tr>`;
            page.elements.summary.textContent = "Tai du lieu that bai";
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách loại phòng.");
        }
    };

    page.resetForm = function resetForm() {
        page.state.editingId = "";
        page.elements.originalId.value = "";
        page.elements.typeId.value = "";
        page.elements.typeName.value = "";
        page.elements.typeId.disabled = false;
        page.elements.formKicker.textContent = "Room Type";
    };

    page.openCreateModal = function openCreateModal() {
        page.resetForm();
        page.showModal(page.elements.formModal);
    };

    page.openEditModal = function openEditModal(typeId) {
        const item = page.state.roomTypes.find(type => String(type?.id ?? type?.Id) === String(typeId));
        if (!item) {
            page.notifier?.error("Khong tim thay loai phong can sua.");
            return;
        }

        page.state.editingId = String(typeId);
        page.elements.originalId.value = String(typeId);
        page.elements.typeId.value = String(item?.id ?? item?.Id ?? "");
        page.elements.typeName.value = item?.name ?? item?.Name ?? "";
        page.elements.typeId.disabled = true;
        page.elements.formKicker.textContent = "Update Room Type";
        page.showModal(page.elements.formModal);
    };

    page.buildPayload = function buildPayload() {
        return {
            id: page.elements.typeId.value.trim(),
            name: page.elements.typeName.value.trim()
        };
    };

    page.validatePayload = function validatePayload(payload) {
        if (!payload.id) {
            return "Ma loai phong khong duoc de trong.";
        }

        if (!payload.name) {
            return "Ten loai phong khong duoc de trong.";
        }

        return "";
    };

    page.submitForm = async function submitForm() {
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
            if (page.state.editingId) {
                await apiClient.Put(`${page.roomApiUrl}/types/${page.state.editingId}`, payload);
                page.notifier?.success("Cập nhật loại phòng thành công.");
            } else {
                await apiClient.Post(`${page.roomApiUrl}/types`, payload);
                page.notifier?.success("Them loai phong thanh cong.");
            }

            page.hideModal(page.elements.formModal);
            await page.loadRoomTypes();
        } catch (error) {
            console.error("Submit room type failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể lưu loại phòng.");
        } finally {
            page.state.isSubmitting = false;
            page.elements.submitButton.disabled = false;
        }
    };

    page.openDeleteModal = function openDeleteModal(typeId) {
        const item = page.state.roomTypes.find(type => String(type?.id ?? type?.Id) === String(typeId));
        if (!item) {
            page.notifier?.error("Khong tim thay loai phong can xoa.");
            return;
        }

        page.state.deletingId = String(typeId);
        page.elements.deleteTarget.textContent = `${item?.id ?? item?.Id ?? ""} - ${item?.name ?? item?.Name ?? ""}`;
        page.showModal(page.elements.deleteModal);
    };

    page.submitDelete = async function submitDelete() {
        if (page.state.isDeleting || !page.ensureAuthenticated()) {
            return;
        }

        if (!page.state.deletingId) {
            page.notifier?.error("Khong xac dinh duoc loai phong can xoa.");
            return;
        }

        page.state.isDeleting = true;
        page.elements.deleteButton.disabled = true;

        try {
            await apiClient.Delete(`${page.roomApiUrl}/types/${page.state.deletingId}`);
            page.hideModal(page.elements.deleteModal);
            page.notifier?.success("Xóa loại phòng thành công.");
            page.state.deletingId = "";
            await page.loadRoomTypes();
        } catch (error) {
            console.error("Delete room type failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể xóa loại phòng.");
        } finally {
            page.state.isDeleting = false;
            page.elements.deleteButton.disabled = false;
        }
    };

    page.bindEvents = function bindEvents() {
        page.elements.openCreateButton.addEventListener("click", page.openCreateModal);
        page.elements.submitButton.addEventListener("click", page.submitForm);
        page.elements.deleteButton.addEventListener("click", page.submitDelete);

        page.elements.tableBody.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const typeId = button.dataset.id;
            if (!typeId) {
                return;
            }

            if (action === "edit") {
                page.openEditModal(typeId);
            }

            if (action === "delete") {
                page.openDeleteModal(typeId);
            }
        });
    };

    document.addEventListener("DOMContentLoaded", async () => {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            page.bindEvents();
            await page.loadRoomTypes();
        } catch (error) {
            console.error("Room type page initialization failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể khởi tạo màn loại phòng.");
        }
    });
})();
