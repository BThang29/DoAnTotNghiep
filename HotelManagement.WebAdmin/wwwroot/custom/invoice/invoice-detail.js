(() => {
    "use strict";

    const page = window.invoicePage;
    if (!page) {
        return;
    }

    page.detailElements = {
        modal: document.getElementById("invoiceDetailModal"),
        id: document.getElementById("invoiceDetailId"),
        issueDate: document.getElementById("invoiceDetailIssueDate"),
        totalAmount: document.getElementById("invoiceDetailTotalAmount"),
        customerName: document.getElementById("invoiceDetailCustomerName"),
        customerPhone: document.getElementById("invoiceDetailCustomerPhone"),
        bookingId: document.getElementById("invoiceDetailBookingId"),
        roomName: document.getElementById("invoiceDetailRoomName"),
        employeeName: document.getElementById("invoiceDetailEmployeeName"),
        paymentDetails: document.getElementById("invoiceDetailPaymentDetails"),
        nights: document.getElementById("invoiceDetailNights"),
        roomCharge: document.getElementById("invoiceDetailRoomCharge"),
        serviceCharge: document.getElementById("invoiceDetailServiceCharge"),
        serviceCount: document.getElementById("invoiceDetailServiceCount"),
        serviceLines: document.getElementById("invoiceDetailServiceLines"),
        printButton: document.getElementById("invoicePrintButton")
    };

    if (Object.values(page.detailElements).some(element => !element)) {
        return;
    }

    page.setDetailLoading = function setDetailLoading() {
        page.detailElements.id.textContent = "Dang tai...";
        page.detailElements.issueDate.textContent = "-";
        page.detailElements.totalAmount.textContent = page.formatCurrency(0);
        page.detailElements.customerName.textContent = "-";
        page.detailElements.customerPhone.textContent = "-";
        page.detailElements.bookingId.textContent = "-";
        page.detailElements.roomName.textContent = "-";
        page.detailElements.employeeName.textContent = "-";
        page.detailElements.paymentDetails.textContent = "-";
        page.detailElements.nights.textContent = "0";
        page.detailElements.roomCharge.textContent = page.formatCurrency(0);
        page.detailElements.serviceCharge.textContent = page.formatCurrency(0);
        page.detailElements.serviceCount.textContent = "0 dong";
        page.detailElements.serviceLines.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>`;
    };

    page.renderDetail = function renderDetail(detail) {
        page.detailElements.id.textContent = `#${detail?.id ?? detail?.Id ?? "-"}`;
        page.detailElements.issueDate.textContent = page.formatDate(detail?.issueDate ?? detail?.IssueDate);
        page.detailElements.totalAmount.textContent = page.formatCurrency(detail?.totalAmount ?? detail?.TotalAmount ?? 0);
        page.detailElements.customerName.textContent = page.formatValue(detail?.customerName ?? detail?.CustomerName);
        page.detailElements.customerPhone.textContent = page.formatValue(detail?.customerPhone ?? detail?.CustomerPhone);
        page.detailElements.bookingId.textContent = page.formatValue(detail?.bookingId ?? detail?.BookingId);
        page.detailElements.roomName.textContent = page.formatValue(detail?.roomName ?? detail?.RoomName);
        page.detailElements.employeeName.textContent = page.formatValue(detail?.employeeName ?? detail?.EmployeeName);
        page.detailElements.paymentDetails.textContent = page.formatValue(detail?.paymentDetails ?? detail?.PaymentDetails);
        page.detailElements.nights.textContent = String(detail?.nights ?? detail?.Nights ?? 0);
        page.detailElements.roomCharge.textContent = page.formatCurrency(detail?.roomCharge ?? detail?.RoomCharge ?? 0);
        page.detailElements.serviceCharge.textContent = page.formatCurrency(detail?.serviceCharge ?? detail?.ServiceCharge ?? 0);

        const lines = detail?.serviceLines ?? detail?.ServiceLines ?? [];
        page.detailElements.serviceCount.textContent = `${Array.isArray(lines) ? lines.length : 0} dong`;

        if (!Array.isArray(lines) || lines.length === 0) {
            page.detailElements.serviceLines.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">Khong co dich vu phat sinh.</td>
                </tr>`;
            return;
        }

        page.detailElements.serviceLines.innerHTML = lines.map(line => `
            <tr>
                <td>${line?.name ?? line?.Name ?? "-"}</td>
                <td>${line?.quantity ?? line?.Quantity ?? 0}</td>
                <td>${page.formatCurrency(line?.unitPrice ?? line?.UnitPrice ?? 0)}</td>
                <td>${page.parseNumber(line?.discountPercent ?? line?.DiscountPercent)}%</td>
                <td>${page.formatDate(line?.useDate ?? line?.UseDate)}</td>
                <td class="text-right font-weight-bold">${page.formatCurrency(line?.lineTotal ?? line?.LineTotal ?? 0)}</td>
            </tr>`).join("");
    };

    page.openInvoiceDetail = async function openInvoiceDetail(invoiceId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        page.state.currentDetailId = invoiceId;
        page.setDetailLoading();
        page.showModal(page.detailElements.modal);

        try {
            const response = await apiClient.Get(`${page.invoiceApiUrl}/${invoiceId}`);
            page.renderDetail(page.getResultObject(response));
        } catch (error) {
            console.error("Load invoice detail failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể tải chi tiết hóa đơn.");
        }
    };

    page.buildPrintHtml = function buildPrintHtml(detail) {
        const lines = detail?.serviceLines ?? detail?.ServiceLines ?? [];
        const serviceRows = Array.isArray(lines) && lines.length > 0
            ? lines.map(line => `
                <tr>
                    <td>${line?.name ?? line?.Name ?? "-"}</td>
                    <td>${line?.quantity ?? line?.Quantity ?? 0}</td>
                    <td>${page.formatCurrency(line?.unitPrice ?? line?.UnitPrice ?? 0)}</td>
                    <td>${page.parseNumber(line?.discountPercent ?? line?.DiscountPercent)}%</td>
                    <td>${page.formatDate(line?.useDate ?? line?.UseDate)}</td>
                    <td style="text-align:right;">${page.formatCurrency(line?.lineTotal ?? line?.LineTotal ?? 0)}</td>
                </tr>`).join("")
            : `<tr><td colspan="6" style="text-align:center;color:#64748b;">Khong co dich vu phat sinh.</td></tr>`;

        return `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="utf-8">
                <title>Hoa don #${detail?.id ?? detail?.Id ?? ""}</title>
                <style>
                    body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111827}
                    .hero{display:flex;justify-content:space-between;gap:16px;padding:20px;border-radius:16px;background:#eff6ff;margin-bottom:24px}
                    .hero strong{font-size:28px;display:block;margin-top:6px}
                    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
                    .card{border:1px solid #e5e7eb;border-radius:14px;padding:16px}
                    .card h3{margin:0 0 12px;font-size:16px}
                    .field{margin-top:10px}
                    .field span{display:block;font-size:12px;color:#6b7280;margin-bottom:4px}
                    table{width:100%;border-collapse:collapse;margin-top:16px}
                    th,td{padding:10px;border-bottom:1px solid #e5e7eb;font-size:14px}
                    th{text-align:left;background:#f8fafc}
                    .total{margin-top:18px;padding:14px 16px;border-radius:12px;background:#111827;color:#fff;display:flex;justify-content:space-between;font-size:18px;font-weight:700}
                </style>
            </head>
            <body>
                <div class="hero">
                    <div>
                        <div>Hoa don</div>
                        <strong>#${detail?.id ?? detail?.Id ?? "-"}</strong>
                        <div>Ngày lập: ${page.formatDate(detail?.issueDate ?? detail?.IssueDate)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div>Tong thanh toan</div>
                        <strong>${page.formatCurrency(detail?.totalAmount ?? detail?.TotalAmount ?? 0)}</strong>
                    </div>
                </div>
                <div class="grid">
                    <div class="card">
                        <h3>Khách hàng</h3>
                        <div class="field"><span>Ten</span><strong>${page.formatValue(detail?.customerName ?? detail?.CustomerName)}</strong></div>
                        <div class="field"><span>So dien thoai</span><strong>${page.formatValue(detail?.customerPhone ?? detail?.CustomerPhone)}</strong></div>
                        <div class="field"><span>Booking ID</span><strong>${page.formatValue(detail?.bookingId ?? detail?.BookingId)}</strong></div>
                    </div>
                    <div class="card">
                        <h3>Luu tru</h3>
                        <div class="field"><span>Phòng</span><strong>${page.formatValue(detail?.roomName ?? detail?.RoomName)}</strong></div>
                        <div class="field"><span>So dem</span><strong>${page.formatValue(detail?.nights ?? detail?.Nights)}</strong></div>
                        <div class="field"><span>Nhân viên</span><strong>${page.formatValue(detail?.employeeName ?? detail?.EmployeeName)}</strong></div>
                    </div>
                    <div class="card">
                        <h3>Chi phi</h3>
                        <div class="field"><span>Tiền phòng</span><strong>${page.formatCurrency(detail?.roomCharge ?? detail?.RoomCharge ?? 0)}</strong></div>
                        <div class="field"><span>Tiền dịch vụ</span><strong>${page.formatCurrency(detail?.serviceCharge ?? detail?.ServiceCharge ?? 0)}</strong></div>
                        <div class="field"><span>Thanh toan</span><strong>${page.formatValue(detail?.paymentDetails ?? detail?.PaymentDetails)}</strong></div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Dịch vụ</th>
                            <th>So luong</th>
                            <th>Don gia</th>
                            <th>Giam gia</th>
                            <th>Ngày dùng</th>
                            <th style="text-align:right;">Thanh tien</th>
                        </tr>
                    </thead>
                    <tbody>${serviceRows}</tbody>
                </table>
                <div class="total">
                    <span>Tong tien</span>
                    <span>${page.formatCurrency(detail?.totalAmount ?? detail?.TotalAmount ?? 0)}</span>
                </div>
            </body>
            </html>`;
    };

    page.printInvoice = async function printInvoice(invoiceId) {
        if (!page.ensureAuthenticated()) {
            return;
        }

        try {
            const response = await apiClient.Get(`${page.invoiceApiUrl}/${invoiceId}/print`);
            const detail = page.getResultObject(response);
            const printWindow = window.open("", "_blank", "width=980,height=720");

            if (!printWindow) {
                page.notifier?.error("Khong mo duoc cua so in hoa don.");
                return;
            }

            printWindow.document.open();
            printWindow.document.write(page.buildPrintHtml(detail));
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } catch (error) {
            console.error("Print invoice failed:", error);
            page.notifier?.error(error?.data?.message || error?.message || "Không thể in hóa đơn.");
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        page.detailElements.printButton.addEventListener("click", () => {
            if (page.state.currentDetailId) {
                page.printInvoice(page.state.currentDetailId);
            }
        });
    });
})();
