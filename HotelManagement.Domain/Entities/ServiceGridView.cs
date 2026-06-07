namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public class ServiceGridView
    {
        public int Id { get; set; }
        public string NameService { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public string ServiceCode { get; set; } = string.Empty;
        public int? RemainingInventory { get; set; }
        public string UnitName { get; set; } = string.Empty;
        public int? ServiceTypeId { get; set; }
        public string ServiceTypeName { get; set; } = string.Empty;
    }
}
