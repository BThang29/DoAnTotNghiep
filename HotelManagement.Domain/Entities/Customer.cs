using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Customer
    {
        public int id { get; set; }
        public int? userid { get; set; }
        public string fullname { get; set; } = string.Empty;
        public string? identify { get; set; }
        public string? phone { get; set; }
        public string? mail { get; set; }
        public DateTime dob { get; set; }
        public int? customer_type { get; set; }
    }
}
