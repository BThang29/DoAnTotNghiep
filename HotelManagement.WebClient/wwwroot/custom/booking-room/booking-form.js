(function () {
    "use strict";

    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");
    const form = document.getElementById("bookingAvailabilityForm");
    const dateStartInput = document.getElementById("bookingDateStart");
    const dateEndInput = document.getElementById("bookingDateEnd");
    const roomTypeSelect = document.getElementById("bookingRoomTypeId");
    const resultBox = document.getElementById("bookingSearchResult");
    const notifier = window.appNotifier;

    if (!form || !dateStartInput || !dateEndInput || !roomTypeSelect || !resultBox) {
        return;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function setInlineState(message, type) {
        const stateClass = type === "error" ? "is-error" : "is-empty";
        resultBox.innerHTML = `<div class="booking-result-state ${stateClass}">${escapeHtml(message)}</div>`;
    }

    function clearInlineState() {
        resultBox.innerHTML = "";
    }

    function isNetworkError(error) {
        const message = String(error?.message || "").trim().toLowerCase();
        return error instanceof TypeError || message.includes("failed to fetch") || message.includes("networkerror");
    }

    function delay(milliseconds) {
        return new Promise(resolve => {
            window.setTimeout(resolve, milliseconds);
        });
    }

    async function parseJsonResponse(response) {
        const rawText = await response.text();
        if (!rawText) {
            return null;
        }

        try {
            return JSON.parse(rawText);
        } catch (error) {
            return null;
        }
    }

    async function fetchJsonWithRetry(url, retries, retryDelayMs) {
        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            try {
                const response = await fetch(url);
                const data = await parseJsonResponse(response);

                if (!response.ok) {
                    throw new Error(data?.message || data?.Message || "Không thể tải dữ liệu.");
                }

                return data;
            } catch (error) {
                lastError = error;
                if (!isNetworkError(error) || attempt >= retries) {
                    break;
                }

                await delay(retryDelayMs);
            }
        }

        throw lastError || new Error("Không thể tải dữ liệu.");
    }

    function parseDateInput(value) {
        const normalizedValue = String(value || "").trim();
        if (!normalizedValue) {
            return null;
        }

        if (window.jQuery?.datepicker?.parseDate) {
            try {
                return window.jQuery.datepicker.parseDate("dd MM, yy", normalizedValue);
            } catch (error) {
                // Fallback to native parser below.
            }
        }

        const parsedDate = new Date(normalizedValue);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    function formatDateForApi(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getTodayDateOnly() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    function syncDateConstraints() {
        const todayForInput = formatDateForApi(getTodayDateOnly());
        dateStartInput.min = todayForInput;
        dateEndInput.min = dateStartInput.value || todayForInput;
    }

    function notifyValidation(message) {
        if (typeof notifier?.warning === "function") {
            notifier.warning(message);
        }

        setInlineState(message, "error");
    }

    function validateDates(showNotification) {
        syncDateConstraints();

        const dateStart = parseDateInput(dateStartInput.value);
        const dateEnd = parseDateInput(dateEndInput.value);
        const today = getTodayDateOnly();
        if (dateStart && dateStart < today) {
            dateStartInput.value = "";
            syncDateConstraints();

            if (showNotification) {
                notifyValidation("Ngày nhận phòng không được nhỏ hơn ngày hiện tại.");
            }

            return false;
        }

        if (dateEnd && dateEnd < today) {
            dateEndInput.value = "";
            syncDateConstraints();

            if (showNotification) {
                notifyValidation("Ngày trả phòng không được nhỏ hơn ngày hiện tại.");
            }

            return false;
        }

        if (!dateStart || !dateEnd) {
            return true;
        }

        if (dateEnd < dateStart) {
            dateEndInput.value = dateStartInput.value;
            syncDateConstraints();

            if (showNotification) {
                notifyValidation("Ngày trả phòng phải lớn hơn hoặc bằng ngày nhận phòng.");
            }

            return false;
        }

        clearInlineState();
        return true;
    }

    async function loadRoomTypes() {
        let roomTypes;

        try {
            roomTypes = await fetchJsonWithRetry(
                `${apiBaseUrl}/api/client/room/types`,
                2,
                700
            );
        } catch (error) {
            const message = isNetworkError(error)
                ? "Không kết nối được đến hệ thống loại phòng. Vui lòng đợi trong giây lát."
                : (error?.message || "Không thể tải loại phòng.");
            setInlineState(message, "error");
            return;
        }

        const result = Array.isArray(roomTypes?.resultObj)
            ? roomTypes.resultObj
            : Array.isArray(roomTypes?.ResultObj)
                ? roomTypes.ResultObj
                : [];

        roomTypeSelect.innerHTML = ['<option value="">Tất cả loại phòng</option>']
            .concat(result.map(item => {
                const id = item?.id ?? item?.Id ?? "";
                const name = item?.name ?? item?.Name ?? "";
                return `<option value="${escapeHtml(id)}">${escapeHtml(name || id)}</option>`;
            }))
            .join("");

        try {
            if (window.jQuery && typeof window.jQuery(roomTypeSelect).niceSelect === "function") {
                window.jQuery(roomTypeSelect).niceSelect("update");
            }
        } catch (error) {
            console.error("Update room type select UI failed:", error);
        }

        clearInlineState();
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        clearInlineState();

        if (!validateDates(true)) {
            return;
        }

        const dateStart = parseDateInput(dateStartInput.value);
        const dateEnd = parseDateInput(dateEndInput.value);

        if (!dateStart || !dateEnd) {
            const message = "Vui lòng chọn ngày nhận phòng và ngày trả phòng.";
            notifyValidation(message);
            return;
        }

        if (dateEnd < dateStart) {
            const message = "Ngày trả phòng phải lớn hơn hoặc bằng ngày nhận phòng.";
            notifyValidation(message);
            return;
        }

        const query = new URLSearchParams({
            dateStart: formatDateForApi(dateStart),
            dateEnd: formatDateForApi(dateEnd)
        });

        const roomTypeId = String(roomTypeSelect.value || "").trim();
        if (roomTypeId) {
            query.set("roomTypeId", roomTypeId);
        }

        window.location.href = `/BookingRoom/AvailableRooms?${query.toString()}`;
    });

    [dateStartInput, dateEndInput].forEach(input => {
        input.addEventListener("change", () => {
            validateDates(true);
        });

        input.addEventListener("input", () => {
            validateDates(true);
        });

        input.addEventListener("blur", () => {
            validateDates(true);
        });
    });

    syncDateConstraints();
    loadRoomTypes();
})();
