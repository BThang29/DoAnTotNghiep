namespace DoAnWebQuanLyKhachSan.Service.Dtos.Invoices
{
	public class InvoiceCreateDto
	{
		public int BookingId { get; set; }
		public string? PaymentDetails { get; set; }
		public List<InvoiceServiceItemDto> ServiceItems { get; set; } = new();
	}
}
