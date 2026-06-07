namespace DoAnWebQuanLyKhachSan.Service.Dtos.Bookings
{
	public class AvailableRoomDto
	{
		public int RoomId { get; set; }
		public string RoomName { get; set; } = string.Empty;
		public decimal? Price { get; set; }
		public string RoomTypeId { get; set; } = string.Empty;
		public string RoomTypeName { get; set; } = string.Empty;
	}
}
