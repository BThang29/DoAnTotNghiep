namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public class RoomGridView
    {
        public int Id { get; set; }
        public string RoomName { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public string RoomTypeId { get; set; } = string.Empty;
        public string RoomTypeName { get; set; } = string.Empty;
        public string RoomStatusId { get; set; } = string.Empty;
        public string RoomStatusName { get; set; } = string.Empty;
    }
}
