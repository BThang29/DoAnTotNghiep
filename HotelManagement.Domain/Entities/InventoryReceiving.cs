using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class InventoryReceiving
    {
        public int id { get; set; }
        public int? servicedetail_id { get; set; }
        public int? quantity { get; set; }
        public decimal? price { get; set; }
        public DateTime? in_date { get; set; }
    }
}
