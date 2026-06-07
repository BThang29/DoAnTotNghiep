(() => {
    "use strict";

    const page = window.invoicePage;
    const standalonePage = page || {
        invoiceApiUrl: window.appUrl("/api/admin/invoice"),
        bookingApiUrl: window.appUrl("/api/admin/booking-room"),
        serviceApiUrl: window.appUrl("/api/admin/other/services"),
        notifier: window.appNotifier,
        state: {
            bookings: [],
            services: [],
            selectedServices: [],
            lastCalculation: null
        },
        ensureAuthenticated() {
            const token = apiClient.getToken();
            if (token) {
                return true;
            }

            this.notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
            return false;
        },
        getResultObject(response) {
            return response?.resultObj
                || response?.ResultObj
                || response?.data
                || response?.Data
                || response;
        },
        formatDate(value) {
            if (!value) {
                return "-";
            }

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return value;
            }

            return new Intl.DateTimeFormat("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }).format(date);
        },
        formatCurrency(value) {
            return new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0
            }).format(Number(value) || 0);
        },
        parseNumber(value) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
    };

    standalonePage.createElements = {
        createBookingId: document.getElementById("invoiceCreateBookingId"),
        bookingDateStart: document.getElementById("invoiceBookingDateStart"),
        bookingDateEnd: document.getElementById("invoiceBookingDateEnd"),
        createPaymentDetails: document.getElementById("invoiceCreatePaymentDetails"),
        serviceSelect: document.getElementById("invoiceServiceSelect"),
        serviceQuantity: document.getElementById("invoiceServiceQuantity"),
        serviceUseDate: document.getElementById("invoiceServiceUseDate"),
        serviceVoucherId: document.getElementById("invoiceServiceVoucherId"),
        addServiceButton: document.getElementById("invoiceAddServiceButton"),
        selectedServicesCount: document.getElementById("invoiceSelectedServicesCount"),
        selectedServicesEmpty: document.getElementById("invoiceSelectedServicesEmpty"),
        selectedServicesList: document.getElementById("invoiceSelectedServicesList"),
        submitButton: document.getElementById("invoiceSubmitButton")
    };

    if (Object.values(standalonePage.createElements).some(element => !element)) {
        return;
    }

    standalonePage.getSelectedBooking = function getSelectedBooking() {
        const bookingId = Number(standalonePage.createElements.createBookingId.value);
        if (!bookingId) {
            return null;
        }

        return standalonePage.state.bookings.find(item => Number(item?.id ?? item?.Id) === bookingId) ?? null;
    };

    standalonePage.normalizeDateOnly = function normalizeDateOnly(value) {
        if (!value) {
            return null;
        }

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return new Date(value.getFullYear(), value.getMonth(), value.getDate());
        }

        if (typeof value === "string") {
            const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                const year = Number(match[1]);
                const month = Number(match[2]) - 1;
                const day = Number(match[3]);
                return new Date(year, month, day);
            }
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    standalonePage.toInputDateValue = function toInputDateValue(value) {
        const date = standalonePage.normalizeDateOnly(value);
        if (!date) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    standalonePage.syncBookingDateRange = function syncBookingDateRange() {
        const booking = standalonePage.getSelectedBooking();
        const dateStart = booking?.dateStart ?? booking?.DateStart;
        const dateEnd = booking?.dateEnd ?? booking?.DateEnd;

        standalonePage.createElements.bookingDateStart.value = dateStart
            ? standalonePage.formatDate(dateStart)
            : "";
        standalonePage.createElements.bookingDateEnd.value = dateEnd
            ? standalonePage.formatDate(dateEnd)
            : "";
    };

    standalonePage.validateServiceUseDate = function validateServiceUseDate(useDate) {
        if (!useDate) {
            return { valid: true };
        }

        const booking = standalonePage.getSelectedBooking();
        if (!booking) {
            return { valid: false, message: "Vui lòng chọn booking trước khi thêm dịch vụ." };
        }

        const bookingStart = standalonePage.normalizeDateOnly(booking?.dateStart ?? booking?.DateStart);
        const bookingEnd = standalonePage.normalizeDateOnly(booking?.dateEnd ?? booking?.DateEnd);
        const serviceUseDate = standalonePage.normalizeDateOnly(useDate);

        if (!bookingStart || !bookingEnd || !serviceUseDate) {
            return { valid: true };
        }

        if (serviceUseDate < bookingStart || serviceUseDate > bookingEnd) {
            return {
                valid: false,
                message: `Ngày sử dụng phải nằm trong khoảng từ ${standalonePage.formatDate(bookingStart)} đến ${standalonePage.formatDate(bookingEnd)}.`
            };
        }

        return { valid: true };
    };

    standalonePage.renderBookingOptions = function renderBookingOptions() {
        const options = ['<option value="">Chọn booking</option>'];

        standalonePage.state.bookings.forEach(item => {
            const id = item?.id ?? item?.Id;
            const customerName = item?.customerName ?? item?.CustomerName ?? "Khách hàng";
            const roomName = item?.roomName ?? item?.RoomName ?? "Phòng";
            if (id) {
                options.push(`<option value="${id}">#${id} - ${customerName} - ${roomName}</option>`);
            }
        });

        standalonePage.createElements.createBookingId.innerHTML = options.join("");
    };

    standalonePage.loadBookingOptions = async function loadBookingOptions() {
        if (!standalonePage.ensureAuthenticated()) {
            return;
        }

        try {
            const response = await apiClient.Get(`${standalonePage.bookingApiUrl}?page=1&itemsPerPage=200&sortBy=id&sortDesc=true`, { showLoading: false });
            const result = standalonePage.getResultObject(response);
            standalonePage.state.bookings = result?.data ?? result?.Data ?? [];
            standalonePage.renderBookingOptions();
        } catch (error) {
            console.error("Load booking options failed:", error);
            standalonePage.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách booking.");
        }
    };

    standalonePage.renderServiceOptions = function renderServiceOptions() {
        const options = ['<option value="">Chọn dịch vụ</option>'];

        standalonePage.state.services.forEach(item => {
            const id = item?.id ?? item?.Id;
            const name = item?.nameService ?? item?.NameService ?? "Dịch vụ";
            const code = item?.serviceCode ?? item?.ServiceCode ?? "";
            const price = standalonePage.parseNumber(item?.price ?? item?.Price);
            if (id) {
                options.push(`<option value="${id}">${name}${code ? ` (${code})` : ""} - ${standalonePage.formatCurrency(price)}</option>`);
            }
        });

        standalonePage.createElements.serviceSelect.innerHTML = options.join("");
    };

    standalonePage.loadServiceOptions = async function loadServiceOptions() {
        if (!standalonePage.ensureAuthenticated()) {
            return;
        }

        try {
            const response = await apiClient.Get(`${standalonePage.serviceApiUrl}?page=1&itemsPerPage=300&sortBy=id&sortDesc=false`, { showLoading: false });
            const result = standalonePage.getResultObject(response);
            standalonePage.state.services = result?.data ?? result?.Data ?? [];
            standalonePage.renderServiceOptions();
        } catch (error) {
            console.error("Load service options failed:", error);
            standalonePage.notifier?.error(error?.data?.message || error?.message || "Không thể tải danh sách dịch vụ.");
        }
    };

    standalonePage.resetCreateForm = function resetCreateForm() {
        standalonePage.createElements.createBookingId.value = "";
        standalonePage.createElements.bookingDateStart.value = "";
        standalonePage.createElements.bookingDateEnd.value = "";
        standalonePage.createElements.createPaymentDetails.value = "";
        standalonePage.createElements.serviceSelect.value = "";
        standalonePage.createElements.serviceQuantity.value = "1";
        standalonePage.createElements.serviceUseDate.value = "";
        standalonePage.createElements.serviceVoucherId.value = "";
        standalonePage.state.selectedServices = [];
        standalonePage.renderSelectedServices();
        if (typeof standalonePage.resetCalculationView === "function") {
            standalonePage.resetCalculationView();
        }
    };

    standalonePage.getServiceName = function getServiceName(serviceId) {
        const service = standalonePage.state.services.find(item => Number(item?.id ?? item?.Id) === Number(serviceId));
        return service?.nameService ?? service?.NameService ?? `Dịch vụ #${serviceId}`;
    };

    standalonePage.renderSelectedServices = function renderSelectedServices() {
        const items = standalonePage.state.selectedServices;
        standalonePage.createElements.selectedServicesCount.textContent = `${items.length} dòng`;
        standalonePage.createElements.selectedServicesEmpty.style.display = items.length > 0 ? "none" : "block";

        if (items.length === 0) {
            standalonePage.createElements.selectedServicesList.innerHTML = "";
            return;
        }

        standalonePage.createElements.selectedServicesList.innerHTML = items.map((item, index) => `
            <div class="invoice-service-chip">
                <div>
                    <strong>${standalonePage.getServiceName(item.serviceDetailId)}</strong>
                    <small>
                        Số lượng: ${item.quantity} |
                        Ngày dùng: ${item.useDate ? standalonePage.formatDate(item.useDate) : "Hôm nay"} |
                        Voucher ID: ${item.voucherId ?? "Không có"}
                    </small>
                </div>
                <div class="text-right">
                    <button type="button" class="btn btn-outline-danger btn-sm" data-remove-service="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`).join("");
    };

    standalonePage.buildCreatePayload = function buildCreatePayload() {
        return {
            bookingId: Number(standalonePage.createElements.createBookingId.value) || 0,
            paymentDetails: standalonePage.createElements.createPaymentDetails.value.trim() || null,
            serviceItems: standalonePage.state.selectedServices.map(item => ({
                serviceDetailId: item.serviceDetailId,
                quantity: item.quantity,
                useDate: item.useDate || null,
                voucherId: item.voucherId ?? null
            }))
        };
    };

    standalonePage.addSelectedService = function addSelectedService() {
        const serviceDetailId = Number(standalonePage.createElements.serviceSelect.value);
        const quantity = Math.max(1, Number(standalonePage.createElements.serviceQuantity.value) || 1);
        const voucherId = standalonePage.createElements.serviceVoucherId.value ? Number(standalonePage.createElements.serviceVoucherId.value) : null;
        const useDate = standalonePage.createElements.serviceUseDate.value || null;

        if (!serviceDetailId) {
            standalonePage.notifier?.error("Vui lòng chọn dịch vụ.");
            return;
        }

        const useDateValidation = standalonePage.validateServiceUseDate(useDate);
        if (!useDateValidation.valid) {
            standalonePage.notifier?.error(useDateValidation.message);
            return;
        }

        standalonePage.state.selectedServices.push({
            serviceDetailId,
            quantity,
            useDate,
            voucherId: voucherId && voucherId > 0 ? voucherId : null
        });

        standalonePage.createElements.serviceSelect.value = "";
        standalonePage.createElements.serviceQuantity.value = "1";
        standalonePage.createElements.serviceUseDate.value = "";
        standalonePage.createElements.serviceVoucherId.value = "";

        standalonePage.renderSelectedServices();
        if (typeof standalonePage.resetCalculationView === "function") {
            standalonePage.resetCalculationView();
        }
    };

    standalonePage.submitInvoice = async function submitInvoice() {
        if (!standalonePage.ensureAuthenticated()) {
            return;
        }

        const payload = standalonePage.buildCreatePayload();
        if (payload.bookingId <= 0) {
            standalonePage.notifier?.error("Vui lòng chọn booking.");
            return;
        }

        for (const item of payload.serviceItems) {
            const useDateValidation = standalonePage.validateServiceUseDate(item.useDate);
            if (!useDateValidation.valid) {
                standalonePage.notifier?.error(useDateValidation.message);
                return;
            }
        }

        try {
            const response = await apiClient.Post(standalonePage.invoiceApiUrl, payload);
            const newInvoiceId = standalonePage.getResultObject(response);

            standalonePage.resetCreateForm();
            standalonePage.notifier?.redirectWithNotification(
                `/Invoice/Invoices`,
                "Tạo hóa đơn thành công.",
                "success"
            );
        } catch (error) {
            console.error("Create invoice failed:", error);
            standalonePage.notifier?.error(error?.data?.message || error?.message || "Không thể tạo hóa đơn.");
        }
    };

    standalonePage.bindCreateEvents = function bindCreateEvents() {
        standalonePage.createElements.addServiceButton.addEventListener("click", standalonePage.addSelectedService);

        standalonePage.createElements.selectedServicesList.addEventListener("click", event => {
            const button = event.target.closest("[data-remove-service]");
            if (!button) {
                return;
            }

            const index = Number(button.dataset.removeService);
            if (!Number.isFinite(index) || index < 0 || index >= standalonePage.state.selectedServices.length) {
                return;
            }

            standalonePage.state.selectedServices.splice(index, 1);
            standalonePage.renderSelectedServices();

            if (typeof standalonePage.resetCalculationView === "function") {
                standalonePage.resetCalculationView();
            }
        });

        standalonePage.createElements.submitButton.addEventListener("click", standalonePage.submitInvoice);
    };

    window.invoiceCreatePage = standalonePage;

    document.addEventListener("DOMContentLoaded", () => {
        standalonePage.bindCreateEvents();
        standalonePage.createElements.createBookingId.addEventListener("change", () => {
            standalonePage.syncBookingDateRange();
            if (typeof standalonePage.resetCalculationView === "function") {
                standalonePage.resetCalculationView();
            }
        });
        standalonePage.loadBookingOptions();
        standalonePage.loadServiceOptions();
    });
})();
