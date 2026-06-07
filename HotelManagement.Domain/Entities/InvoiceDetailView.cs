using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public class InvoiceDetailView
    {
        public int Id { get; set; }
        public int? BookingId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime? IssueDate { get; set; }
        public string PaymentDetails { get; set; } = string.Empty;
        public int Nights { get; set; }
        public decimal RoomUnitPrice { get; set; }
        public decimal RoomCharge { get; set; }
        public decimal ServiceCharge { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
