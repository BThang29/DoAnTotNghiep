namespace DoAnWebQuanLyKhachSan.Service.Dtos.Invoices
{
	public class InvoiceServiceItemDto
	{
		public int ServiceDetailId { get; set; }
		public int Quantity { get; set; }
		public DateTime? UseDate { get; set; }
		public int? VoucherId { get; set; }
	}
}
