namespace DoAnWebQuanLyKhachSan.Service.Dtos.Payments
{
	public class PaymentUpdateDto
	{
		public string Method { get; set; } = string.Empty;
		public string? AccountName { get; set; }
		public string? AccountNumber { get; set; }
		public string? BankName { get; set; }
		public string? QrContent { get; set; }
		public string? Note { get; set; }
	}
}
