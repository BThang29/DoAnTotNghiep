namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Payment
    {
        public int id { get; set; }
        public string? method { get; set; }
        public string? name_account { get; set; }
        public string? account_number { get; set; }
        public string? bank_name { get; set; }
        public string? qr_content { get; set; }
        public string? note { get; set; }
    }
}
