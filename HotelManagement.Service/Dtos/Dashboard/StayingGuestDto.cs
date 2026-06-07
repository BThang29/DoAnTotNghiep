namespace DoAnWebQuanLyKhachSan.Service.Dtos.Dashboard
{
	public class StayingGuestDto
	{
		public int CustomerId { get; set; }
		public string CustomerName { get; set; } = string.Empty;
		public string Phone { get; set; } = string.Empty;
		public int BookingId { get; set; }
		public string RoomName { get; set; } = string.Empty;
		public DateTime? DateStart { get; set; }
		public DateTime? DateEnd { get; set; }
	}
}
