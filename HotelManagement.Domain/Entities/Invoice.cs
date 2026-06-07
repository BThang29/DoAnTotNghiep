using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Invoice
    {
        public int id { get; set; }
        public int? booking_id { get; set; }
        public DateTime? issue_date { get; set; }
        public int? employee_id { get; set; }
        public int? payment_id { get; set; }
    }
}
