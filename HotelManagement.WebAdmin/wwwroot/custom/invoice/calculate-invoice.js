(() => {
    "use strict";

    const page = window.invoiceCreatePage || window.invoicePage;
    if (!page) {
        return;
    }

    page.calculateElements = {
        calculateButton: document.getElementById("invoiceCalculateButton"),
        calculationPlaceholder: document.getElementById("invoiceCalculationPlaceholder"),
        calculationContent: document.getElementById("invoiceCalculationContent"),
        calcBookingText: document.getElementById("invoiceCalcBookingText"),
        calcCustomerText: document.getElementById("invoiceCalcCustomerText"),
        calcRoomText: document.getElementById("invoiceCalcRoomText"),
        calcNights: document.getElementById("invoiceCalcNights"),
        calcRoomUnitPrice: document.getElementById("invoiceCalcRoomUnitPrice"),
        calcRoomCharge: document.getElementById("invoiceCalcRoomCharge"),
        calcServiceCharge: document.getElementById("invoiceCalcServiceCharge"),
        calcTotalAmount: document.getElementById("invoiceCalcTotalAmount"),
        calculationLines: document.getElementById("invoiceCalculationLines")
    };

    if (Object.values(page.calculateElements).some(element => !element)) {
        return;
    }

    page.resetCalculationView = function resetCalculationView() {
        page.state.lastCalculation = null;
        page.calculateElements.calculationPlaceholder.classList.remove("d-none");
        page.calculateElements.calculationContent.classList.add("d-none");
        page.calculateElements.calculationLines.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Chưa có dữ liệu.</td>
            </tr>`;
    };

    page.renderCalculation = function renderCalculation(result) {
        page.state.lastCalculation = result;
        page.calculateElements.calculationPlaceholder.classList.add("d-none");
        page.calculateElements.calculationContent.classList.remove("d-none");

        page.calculateElements.calcBookingText.textContent = `#${result?.bookingId ?? "-"}`;
        page.calculateElements.calcCustomerText.textContent = result?.customerName || "-";
        page.calculateElements.calcRoomText.textContent = result?.roomName || "-";
        page.calculateElements.calcNights.textContent = String(result?.nights ?? 0);
        page.calculateElements.calcRoomUnitPrice.textContent = page.formatCurrency(result?.roomUnitPrice ?? 0);
        page.calculateElements.calcRoomCharge.textContent = page.formatCurrency(result?.roomCharge ?? 0);
        page.calculateElements.calcServiceCharge.textContent = page.formatCurrency(result?.serviceCharge ?? 0);
        page.calculateElements.calcTotalAmount.textContent = page.formatCurrency(result?.totalAmount ?? 0);

        const lines = result?.serviceLines ?? [];
        if (!Array.isArray(lines) || lines.length === 0) {
            page.calculateElements.calculationLines.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">Không có dịch vụ phát sinh.</td>
                </tr>`;
            return;
        }

        page.calculateElements.calculationLines.innerHTML = lines.map(line => `
            <tr>
                <td>${line?.name ?? line?.Name ?? "-"}</td>
                <td>${line?.quantity ?? line?.Quantity ?? 0}</td>
                <td>${page.formatCurrency(line?.unitPrice ?? line?.UnitPrice ?? 0)}</td>
                <td>${page.parseNumber(line?.discountPercent ?? line?.DiscountPercent)}%</td>
                <td>${page.formatDate(line?.useDate ?? line?.UseDate)}</td>
                <td class="text-right font-weight-bold">${page.formatCurrency(line?.lineTotal ?? line?.LineTotal ?? 0)}</td>
            </tr>`).join("");
    };

    page.calculateInvoice = async function calculateInvoice() {
        if (!page.ensureAuthenticated()) {
            return;
        }

        const payload = page.buildCreatePayload();
        if (payload.bookingId <= 0) {
            page.notifier?.error("Vui lòng chọn booking trước khi tính hóa đơn.");
            return;
        }

        try {
            const response = await apiClient.Post(`${page.invoiceApiUrl}/calculate`, payload);
            page.renderCalculation(page.getResultObject(response));
            if (typeof page.notifier?.success === "function") {
                page.notifier.success("Tính hóa đơn thành công.");
            }
        } catch (error) {
            console.error("Calculate invoice failed:", error);
            page.resetCalculationView();
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tính hóa đơn.");
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        page.calculateElements.calculateButton.addEventListener("click", page.calculateInvoice);
    });
})();
