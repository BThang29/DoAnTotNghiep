(() => {
    "use strict";

    const bookingRoomApiUrl = window.appUrl("/api/admin/booking-room");
    const customerApiUrl = window.appUrl("/api/admin/customer");
    const roomApiUrl = window.appUrl("/api/admin/room");
    const notifier = window.appNotifier;

    const customerIdElement = document.getElementById("createBookingCustomerId");
    const selectedCustomerNameElement = document.getElementById("createBookingSelectedCustomerName");
    const selectedCustomerMetaElement = document.getElementById("createBookingSelectedCustomerMeta");
    const openCustomerModalButtonElement = document.getElementById("createBookingOpenCustomerModalButton");
    const clearCustomerButtonElement = document.getElementById("createBookingClearCustomerButton");
    const customerFullNameElement = document.getElementById("createBookingCustomerFullName");
    const customerPhoneElement = document.getElementById("createBookingCustomerPhone");
    const customerIdentifyElement = document.getElementById("createBookingCustomerIdentify");
    const customerTypeElement = document.getElementById("createBookingCustomerTypeId");
    const customerEmailElement = document.getElementById("createBookingCustomerEmail");
    const customerDobElement = document.getElementById("createBookingCustomerDob");
    const voucherElement = document.getElementById("createBookingVoucherId");
    const dateStartElement = document.getElementById("createBookingDateStart");
    const dateEndElement = document.getElementById("createBookingDateEnd");
    const depositElement = document.getElementById("createBookingDeposit");
    const roomTypeElement = document.getElementById("createBookingRoomTypeId");
    const roomElement = document.getElementById("createBookingRoomId");
    const selectedRoomPriceElement = document.getElementById("createBookingSelectedRoomPrice");
    const checkRoomButtonElement = document.getElementById("createBookingCheckRoomButton");
    const submitButtonElement = document.getElementById("createBookingSubmitButton");
    const statusTextElement = document.getElementById("createBookingStatusText");
    const roomHelpTextElement = document.getElementById("createBookingRoomHelpText");

    const summaryCustomerElement = document.getElementById("createBookingSummaryCustomer");
    const summaryDateElement = document.getElementById("createBookingSummaryDate");
    const summaryRoomElement = document.getElementById("createBookingSummaryRoom");
    const summaryDepositElement = document.getElementById("createBookingSummaryDeposit");
    const summaryVoucherElement = document.getElementById("createBookingSummaryVoucher");

    const customerModalElement = document.getElementById("createBookingCustomerModal");
    const customerSearchKeywordElement = document.getElementById("createBookingCustomerSearchKeyword");
    const customerTableBodyElement = document.getElementById("createBookingCustomerTableBody");

    if (!window.apiClient
        || !customerIdElement
        || !selectedCustomerNameElement
        || !selectedCustomerMetaElement
        || !openCustomerModalButtonElement
        || !clearCustomerButtonElement
        || !customerFullNameElement
        || !customerPhoneElement
        || !customerIdentifyElement
        || !customerTypeElement
        || !customerEmailElement
        || !customerDobElement
        || !voucherElement
        || !dateStartElement
        || !dateEndElement
        || !depositElement
        || !roomTypeElement
        || !roomElement
        || !selectedRoomPriceElement
        || !checkRoomButtonElement
        || !submitButtonElement
        || !statusTextElement
        || !roomHelpTextElement
        || !summaryCustomerElement
        || !summaryDateElement
        || !summaryRoomElement
        || !summaryDepositElement
        || !summaryVoucherElement
        || !customerModalElement
        || !customerSearchKeywordElement
        || !customerTableBodyElement) {
        return;
    }

    const state = {
        customers: [],
        customerTypes: [],
        roomTypes: [],
        availableRooms: [],
        selectedCustomer: null,
        customerSearchTimeoutId: null,
        lastDobValidationValue: "",
        lastDobValidationMessage: ""
    }

    function formatCurrency(value) {
        if (value === null || value === undefined || value === "") {
            return "-";
        }

        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function getPagedResult(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response;
    }

    function getResultObject(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response?.Data
            || response;
    }

    function parseInputDate(value) {
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
    }

    function validateDobValue(value) {
        const trimmedValue = String(value || "").trim();
        if (!trimmedValue) {
            return "";
        }

        const dob = parseInputDate(trimmedValue);
        if (!dob) {
            return "Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng yyyy-mm-dd.";
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dob.getFullYear() > today.getFullYear()) {
            return "Năm sinh không được lớn hơn năm hiện tại.";
        }

        const minimumAdultDob = new Date(today);
        minimumAdultDob.setFullYear(minimumAdultDob.getFullYear() - 18);

        if (dob > minimumAdultDob) {
            return "Khách hàng phải đủ 18 tuổi trở lên.";
        }

        return "";
    }

    function notifyDobValidation() {
        const currentDobValue = String(customerDobElement.value || "").trim();
        const validationMessage = validateDobValue(currentDobValue);
        if (!validationMessage) {
            state.lastDobValidationValue = currentDobValue;
            state.lastDobValidationMessage = "";
            return "";
        }

        if (state.lastDobValidationValue === currentDobValue
            && state.lastDobValidationMessage === validationMessage) {
            return validationMessage;
        }

        state.lastDobValidationValue = currentDobValue;
        state.lastDobValidationMessage = validationMessage;
        notifier?.warning(validationMessage);
        return validationMessage;
    }

    function ensureAuthenticated() {
        const token = apiClient.getToken();
        if (!token) {
            notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "error");
            return false;
        }

        return true;
    }

    function setSelectedCustomer(customer) {
        state.selectedCustomer = customer;
        customerIdElement.value = customer?.id ?? customer?.Id ?? "";

        if (!customer) {
            selectedCustomerNameElement.textContent = "Chưa chọn khách hàng có sẵn";
            selectedCustomerMetaElement.textContent = "Bạn có thể chọn từ danh sách hoặc nhập khách hàng mới bên dưới.";
            return;
        }

        const fullName = customer?.fullName ?? customer?.FullName ?? "-";
        const phone = customer?.phone ?? customer?.Phone ?? "-";
        const identify = customer?.identify ?? customer?.Identify ?? "-";

        selectedCustomerNameElement.textContent = fullName;
        selectedCustomerMetaElement.textContent = `${phone} | ${identify}`;

        customerFullNameElement.value = fullName;
        customerPhoneElement.value = customer?.phone ?? customer?.Phone ?? "";
        customerIdentifyElement.value = customer?.identify ?? customer?.Identify ?? "";
        customerEmailElement.value = customer?.mail ?? customer?.Mail ?? "";
        customerDobElement.value = toInputDate(customer?.dob ?? customer?.Dob);
        customerTypeElement.value = String(customer?.customerTypeId ?? customer?.CustomerTypeId ?? "");
    }

    function clearSelectedCustomer() {
        state.selectedCustomer = null;
        customerIdElement.value = "";
        selectedCustomerNameElement.textContent = "Chưa chọn khách hàng có sẵn";
        selectedCustomerMetaElement.textContent = "Bạn có thể chọn từ danh sách hoặc nhập khách hàng mới bên dưới.";
        customerFullNameElement.value = "";
        customerPhoneElement.value = "";
        customerIdentifyElement.value = "";
        customerEmailElement.value = "";
        customerDobElement.value = "";

        if (state.customerTypes.length > 0) {
            customerTypeElement.value = String(state.customerTypes[0].id ?? state.customerTypes[0].Id ?? "");
        } else {
            customerTypeElement.value = "";
        }
    }

    function toInputDate(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toISOString().split("T")[0];
    }

    function updateSummary() {
        const customerName = customerFullNameElement.value.trim() || selectedCustomerNameElement.textContent || "-";
        const selectedRoomText = roomElement.options[roomElement.selectedIndex]?.text || "-";
        const dateStart = dateStartElement.value || "-";
        const dateEnd = dateEndElement.value || "-";
        const deposit = depositElement.value.trim();
        const voucherId = voucherElement.value.trim();
        const selectedRoom = state.availableRooms.find(x => String(x?.roomId ?? x?.RoomId) === roomElement.value);

        summaryCustomerElement.textContent = customerName || "-";
        summaryDateElement.textContent = dateStart !== "-" && dateEnd !== "-" ? `${dateStart} -> ${dateEnd}` : "-";
        summaryRoomElement.textContent = roomElement.value ? selectedRoomText : "-";
        summaryDepositElement.textContent = formatCurrency(deposit);
        summaryVoucherElement.textContent = voucherId || "-";
        selectedRoomPriceElement.textContent = `Giá phòng: ${selectedRoom ? formatCurrency(selectedRoom?.price ?? selectedRoom?.Price) : "-"}`;
    }

    function renderCustomerTypes(customerTypes) {
        const options = [];

        customerTypes.forEach(customerType => {
            const id = customerType?.id ?? customerType?.Id ?? "";
            const name = customerType?.name ?? customerType?.Name ?? "";
            options.push(`<option value="${id}">${name}</option>`);
        });

        customerTypeElement.innerHTML = options.join("");

        if (customerTypes.length > 0 && !customerTypeElement.value) {
            customerTypeElement.value = String(customerTypes[0].id ?? customerTypes[0].Id);
        }
    }

    function renderRoomTypes(roomTypes) {
        const options = ['<option value="">Tất cả loại phòng</option>'];

        roomTypes.forEach(roomType => {
            const id = roomType?.id ?? roomType?.Id ?? "";
            const name = roomType?.name ?? roomType?.Name ?? id;
            options.push(`<option value="${id}">${name}</option>`);
        });

        roomTypeElement.innerHTML = options.join("");
    }

    function renderAvailableRooms(rooms) {
        const options = ['<option value="">Chọn phòng trống</option>'];

        rooms.forEach(room => {
            const roomId = room?.roomId ?? room?.RoomId;
            const roomName = room?.roomName ?? room?.RoomName ?? `Phòng ${roomId}`;
            const roomTypeName = room?.roomTypeName ?? room?.RoomTypeName ?? "";
            options.push(`<option value="${roomId}">${roomName}${roomTypeName ? ` - ${roomTypeName}` : ""}</option>`);
        });

        roomElement.innerHTML = options.join("");
    }

    function renderCustomerTable(customers) {
        if (!Array.isArray(customers) || customers.length === 0) {
            customerTableBodyElement.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">Không tìm thấy khách hàng phù hợp.</td>
                </tr>`;
            return;
        }

        customerTableBodyElement.innerHTML = customers.map(customer => {
            const id = customer?.id ?? customer?.Id ?? "";
            const fullName = customer?.fullName ?? customer?.FullName ?? "-";
            const phone = customer?.phone ?? customer?.Phone ?? "-";
            const identify = customer?.identify ?? customer?.Identify ?? "-";
            const mail = customer?.mail ?? customer?.Mail ?? "-";

            return `
                <tr>
                    <td>${fullName}</td>
                    <td>${phone}</td>
                    <td>${identify}</td>
                    <td>${mail}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline-primary btn-sm" data-customer-id="${id}">Chọn</button>
                    </td>
                </tr>`;
        }).join("");
    }

    async function loadCustomers(keyword = "") {
        const query = new URLSearchParams({
            page: "1",
            itemsPerPage: "1000"
        });

        if (keyword.trim()) {
            query.set("keyword", keyword.trim());
        }

        const response = await apiClient.Get(`${customerApiUrl}?${query.toString()}`);
        const result = getPagedResult(response);
        state.customers = result?.data ?? result?.Data ?? [];
        renderCustomerTable(state.customers);
    }

    async function loadCustomerTypes() {
        const response = await apiClient.Get(`${customerApiUrl}/types`);
        const result = getResultObject(response);
        state.customerTypes = Array.isArray(result) ? result : [];
        renderCustomerTypes(state.customerTypes);
    }

    async function loadRoomTypes() {
        const response = await apiClient.Get(`${roomApiUrl}/types`);
        const result = getResultObject(response);
        state.roomTypes = Array.isArray(result) ? result : [];
        renderRoomTypes(state.roomTypes);
    }

    function validateAvailabilityFilters() {
        if (!dateStartElement.value || !dateEndElement.value) {
            notifier?.warning("Vui lòng chọn ngày nhận và ngày trả phòng.");
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateStart = parseInputDate(dateStartElement.value);
        if (!dateStart) {
            notifier?.warning("Ngày nhận phòng không hợp lệ.");
            return false;
        }

        if (dateStart < today) {
            notifier?.warning("Ngày nhận phòng không được nhỏ hơn ngày hiện tại.");
            return false;
        }

        if (dateEndElement.value < dateStartElement.value) {
            notifier?.warning("Ngày trả phòng phải lớn hơn hoặc bằng ngày nhận phòng.");
            return false;
        }

        return true;
    }

    function validateDateStartInput(showNotification = true) {
        const currentValue = String(dateStartElement.value || "").trim();
        if (!currentValue) {
            return true;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateStart = parseInputDate(currentValue);

        if (!dateStart) {
            if (showNotification) {
                notifier?.warning("Ngày nhận phòng không hợp lệ.");
            }
            return false;
        }

        if (dateStart < today) {
            dateStartElement.value = "";
            if (showNotification) {
                notifier?.warning("Ngày nhận phòng không được nhỏ hơn ngày hiện tại.");
            }
            return false;
        }

        return true;
    }

    function validateDateEndInput(showNotification = true) {
        const currentValue = String(dateEndElement.value || "").trim();
        if (!currentValue) {
            return true;
        }

        const dateEnd = parseInputDate(currentValue);
        if (!dateEnd) {
            if (showNotification) {
                notifier?.warning("Ngày trả phòng không hợp lệ.");
            }
            return false;
        }

        const dateStart = parseInputDate(dateStartElement.value);
        if (dateStart && dateEnd < dateStart) {
            dateEndElement.value = "";
            if (showNotification) {
                notifier?.warning("Ngày trả phòng phải lớn hơn hoặc bằng ngày nhận phòng.");
            }
            return false;
        }

        return true;
    }

    async function loadAvailableRooms() {
        if (!validateAvailabilityFilters()) {
            return;
        }

        roomElement.innerHTML = '<option value="">Đang tải phòng trống...</option>';
        roomHelpTextElement.textContent = "Đang kiểm tra danh sách phòng trống...";

        try {
            const query = new URLSearchParams({
                dateStart: dateStartElement.value,
                dateEnd: dateEndElement.value
            });

            if (roomTypeElement.value) {
                query.set("roomTypeId", roomTypeElement.value);
            }

            const response = await apiClient.Get(`${bookingRoomApiUrl}/available-rooms?${query.toString()}`);
            const result = getResultObject(response);
            state.availableRooms = Array.isArray(result) ? result : [];
            renderAvailableRooms(state.availableRooms);

            roomHelpTextElement.textContent = state.availableRooms.length > 0
                ? `Tìm thấy ${state.availableRooms.length} phòng trống phù hợp.`
                : "Không có phòng trống trong khoảng thời gian đã chọn.";
        } catch (error) {
            console.error("Load available rooms failed:", error);
            state.availableRooms = [];
            roomElement.innerHTML = '<option value="">Không thể tải phòng trống</option>';
            roomHelpTextElement.textContent = "Không thể kiểm tra phòng trống.";
            notifier?.error(error?.message || "Không thể tải danh sách phòng trống.");
        }

        updateSummary();
    }

    function validateSubmit() {
        if (!customerIdElement.value && !customerFullNameElement.value.trim()) {
            notifier?.warning("Vui lòng chọn khách hàng có sẵn hoặc nhập tên khách hàng mới.");
            customerFullNameElement.focus();
            return false;
        }

        if (!validateAvailabilityFilters()) {
            return false;
        }

        const dobValidationMessage = validateDobValue(customerDobElement.value);
        if (dobValidationMessage) {
            notifier?.warning(dobValidationMessage);
            customerDobElement.focus();
            return false;
        }

        if (!roomElement.value) {
            notifier?.warning("Vui lòng chọn phòng.");
            roomElement.focus();
            return false;
        }

        if (depositElement.value && Number(depositElement.value) < 0) {
            notifier?.warning("Tiền cọc không hợp lệ.");
            depositElement.focus();
            return false;
        }

        if (voucherElement.value && Number(voucherElement.value) <= 0) {
            notifier?.warning("Voucher ID không hợp lệ.");
            voucherElement.focus();
            return false;
        }

        return true;
    }

    async function ensureCustomerId() {
        if (customerIdElement.value) {
            return Number(customerIdElement.value);
        }

        const customerTypeId = customerTypeElement.value ? Number(customerTypeElement.value) : null;
        const payload = {
            id: 0,
            fullName: customerFullNameElement.value.trim(),
            identify: customerIdentifyElement.value.trim() || null,
            phone: customerPhoneElement.value.trim() || null,
            mail: customerEmailElement.value.trim() || null,
            dob: customerDobElement.value || null,
            customer_Type: customerTypeId
        };

        const response = await apiClient.Post(customerApiUrl, payload);
        const result = getResultObject(response);
        const createdCustomerId = Number(result);

        if (!createdCustomerId) {
            throw new Error("Không thể tạo khách hàng mới.");
        }

        customerIdElement.value = String(createdCustomerId);
        selectedCustomerNameElement.textContent = payload.fullName;
        selectedCustomerMetaElement.textContent = `${payload.phone || "-"} | ${payload.identify || "-"}`;
        return createdCustomerId;
    }

    async function submitBooking() {
        if (!validateSubmit()) {
            return;
        }

        statusTextElement.textContent = "Đang xử lý tạo booking...";

        try {
            const customerId = await ensureCustomerId();

            const payload = {
                id: 0,
                customerId: customerId,
                roomId: Number(roomElement.value),
                dateStart: dateStartElement.value,
                dateEnd: dateEndElement.value,
                deposit: depositElement.value ? Number(depositElement.value) : 0,
                voucherId: voucherElement.value ? Number(voucherElement.value) : null
            };

            const response = await apiClient.Post(bookingRoomApiUrl, payload);
            const responseStatusCode = response?.statusCode ?? response?.StatusCode ?? 0;
            const responseMessage = response?.message ?? response?.Message ?? "Không thể tạo đặt phòng.";

            if (responseStatusCode === 201) {
                notifier?.redirectWithNotification("/BookingRoom/BookingRoom", responseMessage, "success");
                return;
            }

            statusTextElement.textContent = "Tạo booking thất bại.";
            notifier?.error(responseMessage);
        } catch (error) {
            console.error("Create booking failed:", error);
            statusTextElement.textContent = "Tạo booking thất bại.";
            notifier?.error(error?.message || "Không thể tạo đặt phòng.");
        }
    }

    function bindEvents() {
        openCustomerModalButtonElement.addEventListener("click", () => {
            if (window.jQuery) {
                window.jQuery(customerModalElement).modal("show");
            }
        });

        clearCustomerButtonElement.addEventListener("click", () => {
            clearSelectedCustomer();
            updateSummary();
        });

        customerSearchKeywordElement.addEventListener("input", () => {
            if (state.customerSearchTimeoutId) {
                clearTimeout(state.customerSearchTimeoutId);
            }

            state.customerSearchTimeoutId = setTimeout(async () => {
                customerTableBodyElement.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted">Đang tìm khách hàng...</td>
                    </tr>`;

                try {
                    await loadCustomers(customerSearchKeywordElement.value);
                } catch (error) {
                    console.error("Search customers failed:", error);
                    customerTableBodyElement.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center text-muted">Không thể tải danh sách khách hàng.</td>
                        </tr>`;
                    notifier?.error(error?.message || "Không thể tìm kiếm khách hàng.");
                }
            }, 400);
        });

        customerTableBodyElement.addEventListener("click", event => {
            const button = event.target.closest("[data-customer-id]");
            if (!button) {
                return;
            }

            const customerId = Number(button.dataset.customerId);
            const customer = state.customers.find(item => Number(item?.id ?? item?.Id) === customerId);
            if (!customer) {
                return;
            }

            setSelectedCustomer(customer);
            updateSummary();

            if (window.jQuery) {
                window.jQuery(customerModalElement).modal("hide");
            }
        });

        checkRoomButtonElement.addEventListener("click", loadAvailableRooms);
        submitButtonElement.addEventListener("click", submitBooking);

        [
            customerFullNameElement,
            customerPhoneElement,
            customerIdentifyElement,
            customerTypeElement,
            customerEmailElement,
            customerDobElement,
            voucherElement,
            dateStartElement,
            dateEndElement,
            depositElement,
            roomTypeElement,
            roomElement
        ].forEach(element => {
            element.addEventListener("change", updateSummary);
            element.addEventListener("input", updateSummary);
        });

        ["change", "blur"].forEach(eventName => {
            dateStartElement.addEventListener(eventName, () => {
                if (validateDateStartInput()) {
                    validateDateEndInput(false);
                }
                updateSummary();
            });

            dateEndElement.addEventListener(eventName, () => {
                validateDateEndInput();
                updateSummary();
            });
        });

        roomTypeElement.addEventListener("change", () => {
            renderAvailableRooms([]);
            roomHelpTextElement.textContent = "Chọn ngày và loại phòng để kiểm tra phòng trống.";
        });

        ["change", "blur"].forEach(eventName => {
            customerDobElement.addEventListener(eventName, notifyDobValidation);
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        if (!ensureAuthenticated()) {
            return;
        }

        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        dateStartElement.value = today;
        dateEndElement.value = tomorrow;

        try {
            await Promise.all([loadCustomers(), loadCustomerTypes(), loadRoomTypes()]);
            renderAvailableRooms([]);
            clearSelectedCustomer();
            statusTextElement.textContent = "Tải dữ liệu ban đầu thành công. Hãy kiểm tra phòng trống trước khi tạo booking.";
        } catch (error) {
            console.error("Load create booking room data failed:", error);
            statusTextElement.textContent = "Không thể tải dữ liệu ban đầu.";
            notifier?.error(error?.message || "Không thể tải dữ liệu tạo booking.");
        }

        bindEvents();
        updateSummary();
    });
})();
