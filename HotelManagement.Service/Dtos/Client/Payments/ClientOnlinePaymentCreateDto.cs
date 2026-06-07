namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Payments
{
	public class ClientOnlinePaymentCreateDto
	{
		public int BookingId { get; set; }
		public string Method { get; set; } = string.Empty;
		public string? AccountName { get; set; }
		public string? AccountNumber { get; set; }
		public string? BankName { get; set; }
		public string? QrContent { get; set; }
		public string? Note { get; set; }
		public string? BookingAccessToken { get; set; }
	}
}
