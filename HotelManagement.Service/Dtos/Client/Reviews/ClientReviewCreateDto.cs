namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Reviews
{
	public class ClientReviewCreateDto
	{
		public int BookingId { get; set; }
		public int? CustomerId { get; set; }
		public string? Phone { get; set; }
		public decimal Rating { get; set; }
		public string Feedback { get; set; } = string.Empty;
	}
}
