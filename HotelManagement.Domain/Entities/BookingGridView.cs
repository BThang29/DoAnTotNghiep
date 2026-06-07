using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public class BookingGridView
    {
        public int Id { get; set; }
        public int? CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int? RoomId { get; set; }
        public string RoomName { get; set; } = string.Empty;
        public DateTime? DateBooking { get; set; }
        public DateTime? DateStart { get; set; }
        public DateTime? DateEnd { get; set; }
        public decimal? Deposit { get; set; }
        public int? EmployeeId { get; set; }
        public int? VoucherId { get; set; }
    }
}
