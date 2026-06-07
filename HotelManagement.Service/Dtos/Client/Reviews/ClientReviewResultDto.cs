namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Reviews
{
	public class ClientReviewResultDto
	{
		public int ReviewId { get; set; }
		public int BookingId { get; set; }
		public decimal Rating { get; set; }
		public string Feedback { get; set; } = string.Empty;
		public DateTime CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }
	}
}
