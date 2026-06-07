using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class InvoiceDetail
    {
        public int id { get; set; }
        public int? invoice_id { get; set; }
        public int? servicedetail_id { get; set; }
        public int? quantity { get; set; }
        public DateTime? use_date { get; set; }
        public int? voucher_id { get; set; }
    }
}
