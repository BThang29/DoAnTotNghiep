namespace DoAnWebQuanLyKhachSan.Service.Dtos.Bookings
{
	public class AvailableRoomQueryDto
	{
		public DateTime DateStart { get; set; }
		public DateTime DateEnd { get; set; }
		public string? RoomTypeId { get; set; }
	}
}
