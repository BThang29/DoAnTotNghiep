using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Booking
    {
        public int id { get; set; }
        public int? user_id { get; set; }
        public int? room_id { get; set; }
        public DateTime? date_booking { get; set; }
        public DateTime? booking_exprire { get; set; }
        public DateTime? date_start { get; set; }
        public DateTime? date_end { get; set; }
        public decimal? deposit { get; set; }
        public int? employee_id { get; set; }
        public int? voucher_id { get; set; }
        public int booking_status { get; set; }
        public string? guest_full_name { get; set; }
        public string? guest_email { get; set; }
        public string? guest_access_token { get; set; }
    }
}
