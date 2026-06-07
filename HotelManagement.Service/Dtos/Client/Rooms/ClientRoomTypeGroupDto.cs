namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Rooms
{
	public class ClientRoomTypeGroupDto
	{
		public string RoomTypeId { get; set; } = string.Empty;
		public string RoomTypeName { get; set; } = string.Empty;
		public List<ClientRoomDto> Rooms { get; set; } = new();
	}
}
