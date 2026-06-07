namespace DoAnWebQuanLyKhachSan.Service.Dtos.Dashboard
{
	public class RoomTypeOccupancyDto
	{
		public string RoomTypeId { get; set; } = string.Empty;
		public string RoomTypeName { get; set; } = string.Empty;
		public int TotalRooms { get; set; }
		public int OccupiedRooms { get; set; }
		public int AvailableRooms { get; set; }
		public int OccupancyPercent { get; set; }
	}
}
