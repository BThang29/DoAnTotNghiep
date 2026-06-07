using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class BookingHistory
    {
        public int id { get; set; }
        public int? booking_id { get; set; }
        public DateTime? date_start { get; set; }
        public DateTime? date_end { get; set; }
        public decimal? total_payment { get; set; }
        public string? special_request { get; set; }
        public string? feedback { get; set; }
    }
}
