using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Voucher
    {
        public int id { get; set; }
        public string voucher_code { get; set; } = string.Empty;
        public decimal? voucher_percent { get; set; }
        public DateTime? date_start { get; set; }
        public DateTime? date_end { get; set; }
    }
}
