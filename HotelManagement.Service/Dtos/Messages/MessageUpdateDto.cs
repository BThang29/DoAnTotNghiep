namespace DoAnWebQuanLyKhachSan.Service.Dtos.Messages
{
    public class MessageUpdateDto
    {
        public int? ConversationId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int? UserId { get; set; }
        public int? CustomerId { get; set; }
        public string? GuestToken { get; set; }
        public int? AssignedAdminUserId { get; set; }
        public int? SenderUserId { get; set; }
        public string SenderRole { get; set; } = "Customer";
        public string? ConversationKey { get; set; }
        public DateTime? CreateDate { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool Seen { get; set; }
        public DateTime? SeenDate { get; set; }
    }
}
