namespace DoAnWebQuanLyKhachSan.Service.Dtos.Chat
{
    public class ChatThreadDto
    {
        public int CustomerId { get; set; }
        public int UserId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public bool IsGuest { get; set; }
        public string GuestToken { get; set; } = string.Empty;
        public string GuestEmail { get; set; } = string.Empty;
        public string GuestPhone { get; set; } = string.Empty;
        public string VerificationStatus { get; set; } = string.Empty;
        public DateTime? VerifiedAt { get; set; }
        public int? AssignedAdminUserId { get; set; }
        public string AssignedAdminName { get; set; } = string.Empty;
        public string ConversationKey { get; set; } = string.Empty;
        public string LastMessage { get; set; } = string.Empty;
        public string LastSenderRole { get; set; } = string.Empty;
        public DateTime? LastMessageDate { get; set; }
        public int UnseenCount { get; set; }
    }
}
