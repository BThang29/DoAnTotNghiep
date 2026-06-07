namespace DoAnWebQuanLyKhachSan.Service.Dtos.Payments
{
	public class PaymentDetailDto
	{
		public int Id { get; set; }
		public string Method { get; set; } = string.Empty;
		public string AccountName { get; set; } = string.Empty;
		public string AccountNumber { get; set; } = string.Empty;
		public string BankName { get; set; } = string.Empty;
		public string QrContent { get; set; } = string.Empty;
		public string Note { get; set; } = string.Empty;
		public int? InvoiceId { get; set; }
	}
}
