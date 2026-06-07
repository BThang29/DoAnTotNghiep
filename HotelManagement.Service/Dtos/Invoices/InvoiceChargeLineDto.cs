namespace DoAnWebQuanLyKhachSan.Service.Dtos.Invoices
{
	public class InvoiceChargeLineDto
	{
		public int? ServiceDetailId { get; set; }
		public string Name { get; set; } = string.Empty;
		public int Quantity { get; set; }
		public decimal UnitPrice { get; set; }
		public decimal DiscountPercent { get; set; }
		public decimal LineTotal { get; set; }
		public DateTime? UseDate { get; set; }
	}
}
