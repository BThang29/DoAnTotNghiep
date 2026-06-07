using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Review
    {
        public int id { get; set; }
        public int booking_id { get; set; }
        public int? customer_id { get; set; }
        public decimal rating { get; set; }
        public string feedback { get; set; } = string.Empty;
        public DateTime created_at { get; set; }
        public DateTime? updated_at { get; set; }
    }
}
