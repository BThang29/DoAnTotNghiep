namespace DoAnWebQuanLyKhachSan.Service.Dtos.Chat
{
    public class ChatMessageDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public int UserId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string GuestToken { get; set; } = string.Empty;
        public int? AssignedAdminUserId { get; set; }
        public string AssignedAdminName { get; set; } = string.Empty;
        public int? SenderUserId { get; set; }
        public string SenderRole { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string ConversationKey { get; set; } = string.Empty;
        public DateTime CreateDate { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool Seen { get; set; }
        public DateTime? SeenDate { get; set; }
    }
}
