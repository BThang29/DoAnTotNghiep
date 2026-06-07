(() => {
    "use strict";

    const page = window.customerPage;
    if (!page || !window.apiClient) {
        return;
    }

    page.elements.typeModal = document.getElementById("customerTypeModal");
    page.elements.typeCustomerId = document.getElementById("customerTypeCustomerId");
    page.elements.typeTargetName = document.getElementById("customerTypeTargetName");
    page.elements.typeSelect = document.getElementById("customerTypeSelect");
    page.elements.typeUpdateButton = document.getElementById("customerTypeUpdateButton");

    if (!page.elements.typeModal
        || !page.elements.typeCustomerId
        || !page.elements.typeTargetName
        || !page.elements.typeSelect
        || !page.elements.typeUpdateButton) {
        return;
    }

    page.state.typeSubmitting = false;

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

    page.renderTypeOptions = function renderTypeOptions(selectedId) {
        page.elements.typeSelect.innerHTML = page.state.customerTypes
            .map(item => `<option value="${item.id}">${item.name}</option>`)
            .join("");

        page.elements.typeSelect.value = selectedId || "";
    };

    page.findCustomerInList = function findCustomerInList(customerId) {
        return page.state.customers.find(item => Number(item?.id ?? item?.Id) === Number(customerId)) || null;
    };

    page.openCustomerTypeModal = async function openCustomerTypeModal(customerId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        let customer = page.findCustomerInList(customerId);
        if (!customer) {
            try {
                const response = await apiClient.Get(`${page.customerApiUrl}/${customerId}`, { showLoading: false });
                customer = page.getResultObject(response);
            } catch (error) {
                console.error("Load customer detail for type failed:", error);
            }
        }

        page.elements.typeCustomerId.value = String(customerId);
        page.elements.typeTargetName.textContent = customer?.fullName ?? customer?.FullName ?? `#${customerId}`;
        page.renderTypeOptions(customer?.customerTypeId ?? customer?.CustomerTypeId ?? "");
        page.showModal(page.elements.typeModal);
    };

    page.submitCustomerTypeUpdate = async function submitCustomerTypeUpdate() {
        if (page.state.typeSubmitting || !page.ensureAuthenticated()) {
            return;
        }

        const customerId = Number(page.elements.typeCustomerId.value);
        const customerTypeId = Number(page.elements.typeSelect.value);

        if (!customerId) {
            page.notifier?.error("Khong xac dinh duoc khach hang can cap nhat loai.");
            return;
        }

        if (!customerTypeId) {
            if (typeof page.notifier?.warning === "function") {
                page.notifier.warning("Vui lòng chọn loại khách hàng.");
            } else {
                page.notifier?.error?.("Vui lòng chọn loại khách hàng.");
            }
            return;
        }

        page.state.typeSubmitting = true;
        page.elements.typeUpdateButton.disabled = true;

        try {
            await apiClient.Put(`${page.customerApiUrl}/${customerId}/type`, { customerTypeId: customerTypeId });
            page.hideModal(page.elements.typeModal);
            page.notifier?.success("Cập nhật loại khách hàng thành công.");
            await page.loadCustomers();
        } catch (error) {
            console.error("Update customer type failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể cập nhật loại khách hàng.");
        } finally {
            page.state.typeSubmitting = false;
            page.elements.typeUpdateButton.disabled = false;
        }
    };

    page.elements.typeUpdateButton.addEventListener("click", page.submitCustomerTypeUpdate);
})();
