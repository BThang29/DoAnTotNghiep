namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Bookings
{
	public class ClientBookingResultDto
	{
		public int BookingId { get; set; }
		public int CustomerId { get; set; }
		public string CustomerName { get; set; } = string.Empty;
		public int RoomId { get; set; }
		public string RoomName { get; set; } = string.Empty;
		public decimal? RoomPrice { get; set; }
		public DateTime DateStart { get; set; }
		public DateTime DateEnd { get; set; }
		public decimal? Deposit { get; set; }
		public int BookingStatus { get; set; }
		public string GuestAccessToken { get; set; } = string.Empty;
	}
}
