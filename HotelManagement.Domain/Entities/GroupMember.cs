namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class GroupMember
    {
        public string fullname { get; set; } = string.Empty;
        public string? relationship { get; set; }
        public int group_id { get; set; }
    }
}
