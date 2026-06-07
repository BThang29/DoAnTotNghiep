(() => {
    "use strict";

    const page = window.employeePage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.detailModal = document.getElementById("employeeDetailModal");
    page.elements.detailId = document.getElementById("employeeDetailId");
    page.elements.detailUserName = document.getElementById("employeeDetailUserName");
    page.elements.detailFullName = document.getElementById("employeeDetailFullName");
    page.elements.detailEmail = document.getElementById("employeeDetailEmail");
    page.elements.detailPhoneNumber = document.getElementById("employeeDetailPhoneNumber");
    page.elements.detailAddress = document.getElementById("employeeDetailAddress");
    page.elements.detailNewPassword = document.getElementById("employeeDetailNewPassword");
    page.elements.detailBackgroundImage = document.getElementById("employeeDetailBackgroundImage");
    page.elements.detailBackgroundImageFile = document.getElementById("employeeDetailBackgroundImageFile");
    page.elements.detailAvatarPreview = document.getElementById("employeeDetailAvatarPreview");
    page.elements.detailRoleIds = document.getElementById("employeeDetailRoleIds");
    page.elements.detailSaveButton = document.getElementById("employeeDetailSaveButton");

    if (Object.values({
        detailModal: page.elements.detailModal,
        detailId: page.elements.detailId,
        detailUserName: page.elements.detailUserName,
        detailFullName: page.elements.detailFullName,
        detailEmail: page.elements.detailEmail,
        detailPhoneNumber: page.elements.detailPhoneNumber,
        detailAddress: page.elements.detailAddress,
        detailNewPassword: page.elements.detailNewPassword,
        detailBackgroundImage: page.elements.detailBackgroundImage,
        detailBackgroundImageFile: page.elements.detailBackgroundImageFile,
        detailAvatarPreview: page.elements.detailAvatarPreview,
        detailRoleIds: page.elements.detailRoleIds,
        detailSaveButton: page.elements.detailSaveButton
    }).some(element => !element)) {
        return;
    }

    page.state.detailSubmitting = false;
    page.state.detailUploadingImage = false;

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

    page.renderDetailRoleOptions = function renderDetailRoleOptions(selectedIds) {
        if (!page.state.canViewRoles) {
            const selectedSet = new Set((selectedIds || []).map(item => Number(item)));
            page.elements.detailRoleIds.disabled = true;
            page.elements.detailRoleIds.innerHTML = (page.state.detailRoleIds || [])
                .map((roleId, index) => {
                    const roleName = page.state.detailRoleNames?.[index] || `Role #${roleId}`;
                    const isSelected = selectedSet.has(Number(roleId)) ? "selected" : "";
                    return `<option value="${roleId}" ${isSelected}>${page.escapeHtml(roleName)}</option>`;
                })
                .join("");
            return;
        }

        page.elements.detailRoleIds.disabled = false;
        const selectedSet = new Set((selectedIds || []).map(item => Number(item)));
        page.elements.detailRoleIds.innerHTML = page.state.roleOptions
            .map(item => `<option value="${item.id}" ${selectedSet.has(Number(item.id)) ? "selected" : ""}>${page.escapeHtml(item.name)}</option>`)
            .join("");
    };

    page.resetDetailForm = function resetDetailForm() {
        page.elements.detailId.value = "";
        page.elements.detailUserName.value = "";
        page.elements.detailFullName.value = "";
        page.elements.detailEmail.value = "";
        page.elements.detailPhoneNumber.value = "";
        page.elements.detailAddress.value = "";
        page.elements.detailNewPassword.value = "";
        page.elements.detailBackgroundImage.value = "";
        page.elements.detailBackgroundImageFile.value = "";
        page.elements.detailAvatarPreview.src = page.resolveImageUrl("");
        page.renderDetailRoleOptions([]);
    };

    page.fillDetailForm = function fillDetailForm(item) {
        const roleIds = item?.roleIds ?? item?.RoleIds ?? [];
        const roleNames = item?.roleNames ?? item?.RoleNames ?? [];
        const backgroundImage = item?.backgroundImage ?? item?.BackgroundImage ?? item?.backgroundimage ?? "";

        page.state.detailRoleIds = Array.isArray(roleIds) ? roleIds.map(value => Number(value)).filter(Number.isFinite) : [];
        page.state.detailRoleNames = Array.isArray(roleNames) ? roleNames.map(value => String(value || "").trim()) : [];

        page.elements.detailId.value = item?.id ?? item?.Id ?? "";
        page.elements.detailUserName.value = item?.userName ?? item?.UserName ?? "";
        page.elements.detailFullName.value = item?.fullName ?? item?.FullName ?? "";
        page.elements.detailEmail.value = item?.email ?? item?.Email ?? "";
        page.elements.detailPhoneNumber.value = item?.phoneNumber ?? item?.PhoneNumber ?? "";
        page.elements.detailAddress.value = item?.address ?? item?.Address ?? "";
        page.elements.detailNewPassword.value = "";
        page.elements.detailBackgroundImage.value = backgroundImage;
        page.elements.detailAvatarPreview.src = page.resolveImageUrl(backgroundImage);
        page.renderDetailRoleOptions(page.state.detailRoleIds);
    };

    page.getSelectedRoleIds = function getSelectedRoleIds() {
        if (!page.state.canViewRoles) {
            return (page.state.detailRoleIds || []).slice();
        }

        return Array.from(page.elements.detailRoleIds.selectedOptions || [])
            .map(option => Number(option.value))
            .filter(Number.isFinite);
    };

    page.openEmployeeDetail = async function openEmployeeDetail(employeeId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.resetDetailForm();

        try {
            const response = await apiClient.Get(`${page.employeeApiUrl}/${employeeId}`);
            const item = page.getResultObject(response);
            page.fillDetailForm(item);
            page.showModal(page.elements.detailModal);
        } catch (error) {
            console.error("Load employee detail failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải chi tiết nhân viên.");
        }
    };

    page.buildDetailPayload = function buildDetailPayload() {
        return {
            userName: page.elements.detailUserName.value.trim(),
            fullName: page.elements.detailFullName.value.trim(),
            email: page.elements.detailEmail.value.trim(),
            phoneNumber: page.elements.detailPhoneNumber.value.trim(),
            address: page.elements.detailAddress.value.trim(),
            backgroundImage: page.elements.detailBackgroundImage.value.trim(),
            newPassword: page.elements.detailNewPassword.value.trim(),
            roleIds: page.getSelectedRoleIds()
        };
    };

    page.validateDetailPayload = function validateDetailPayload(payload) {
        if (!payload.userName) {
            return "Ten dang nhap khong duoc de trong.";
        }

        if (!payload.fullName) {
            return "Ho ten khong duoc de trong.";
        }

        if (payload.roleIds.length === 0) {
            return "Nhân viên phải có ít nhất 1 vai trò.";
        }

        return "";
    };

    page.submitEmployeeDetail = async function submitEmployeeDetail() {
        if (page.state.detailSubmitting || page.state.detailUploadingImage || !page.ensureAuthenticated()) {
            return;
        }

        const employeeId = Number(page.elements.detailId.value);
        if (!employeeId) {
            page.notifier?.error("Khong xac dinh duoc nhan vien can cap nhat.");
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
            await apiClient.Put(`${page.employeeApiUrl}/${employeeId}`, payload);
            page.hideModal(page.elements.detailModal);
            page.notifier?.success("Cập nhật nhân viên thành công.");
            await page.loadEmployees();
        } catch (error) {
            console.error("Update employee failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể cập nhật nhân viên.");
        } finally {
            page.state.detailSubmitting = false;
            page.elements.detailSaveButton.disabled = false;
        }
    };

    page.uploadDetailAvatar = async function uploadDetailAvatar(file) {
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        page.state.detailUploadingImage = true;
        page.elements.detailBackgroundImageFile.disabled = true;
        page.elements.detailSaveButton.disabled = true;

        try {
            const response = await fetch("/Employee/UploadAvatar", {
                method: "POST",
                body: formData
            });

            const contentType = response.headers.get("content-type") || "";
            const responseData = contentType.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw new Error(responseData?.message || "Không thể tải ảnh lên.");
            }

            const uploadedPath = responseData?.path || "";
            if (!uploadedPath) {
                throw new Error("Hệ thống không trả về đường dẫn ảnh.");
            }

            page.elements.detailBackgroundImage.value = uploadedPath;
            page.elements.detailAvatarPreview.src = page.resolveImageUrl(uploadedPath);
            page.notifier?.success("Tải ảnh đại diện thành công.");
        } catch (error) {
            console.error("Upload employee avatar failed:", error);
            page.notifier?.error(error?.message || "Không thể tải ảnh đại diện.");
        } finally {
            page.state.detailUploadingImage = false;
            page.elements.detailBackgroundImageFile.disabled = false;
            page.elements.detailSaveButton.disabled = false;
        }
    };

    page.elements.detailBackgroundImage.addEventListener("input", () => {
        page.elements.detailAvatarPreview.src = page.resolveImageUrl(page.elements.detailBackgroundImage.value);
    });

    page.elements.detailBackgroundImageFile.addEventListener("change", event => {
        const file = event.target.files?.[0];
        page.uploadDetailAvatar(file);
    });

    page.elements.detailSaveButton.addEventListener("click", page.submitEmployeeDetail);
})();
