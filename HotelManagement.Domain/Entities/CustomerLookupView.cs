using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public class CustomerLookupView
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Identify { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Mail { get; set; } = string.Empty;
        public DateTime? Dob { get; set; }
        public int? CustomerTypeId { get; set; }
        public string CustomerTypeName { get; set; } = string.Empty;
    }
}
