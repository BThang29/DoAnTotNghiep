namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Payments
{
	public class ClientOnlinePaymentResultDto
	{
		public int PaymentId { get; set; }
		public int InvoiceId { get; set; }
		public string Method { get; set; } = string.Empty;
		public string QrContent { get; set; } = string.Empty;
		public string Note { get; set; } = string.Empty;
		public decimal TotalAmount { get; set; }
		public DateTime? IssueDate { get; set; }
	}
}
