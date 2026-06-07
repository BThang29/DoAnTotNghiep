namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Room
    {
        public int id { get; set; }
        public string room_name { get; set; } = string.Empty;
        public decimal? price { get; set; }
        public string? roomtype_id { get; set; }
        public string? room_status { get; set; }
    }
}
