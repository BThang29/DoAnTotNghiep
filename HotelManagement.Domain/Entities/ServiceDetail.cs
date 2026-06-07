namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class ServiceDetail
    {
        public int id { get; set; }
        public string name_service { get; set; } = string.Empty;
        public decimal? price { get; set; }
        public string? service_code { get; set; }
        public int? remaining_inventory { get; set; }
        public string? unit_name { get; set; }
        public int? servicetype_id { get; set; }
    }
}
