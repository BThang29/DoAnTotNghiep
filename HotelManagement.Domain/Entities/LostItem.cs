using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class LostItem
    {
        public int id { get; set; }
        public string? room_name { get; set; }
        public string? description { get; set; }
        public DateTime? date_found { get; set; }
        public string? location_found { get; set; }
        public int? employee_id { get; set; }
        public int? customer_id { get; set; }
    }
}
