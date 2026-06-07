using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class InventoryDelivery
    {
        public int servicedetail_id { get; set; }
        public int? quantity { get; set; }
        public DateTime out_date { get; set; }
    }
}
