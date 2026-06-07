namespace DoAnWebQuanLyKhachSan.Service.Dtos.Chat
{
    public class ChatClientContextDto
    {
        public int UserId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public bool IsGuest { get; set; }
        public string GuestToken { get; set; } = string.Empty;
        public string GuestEmail { get; set; } = string.Empty;
        public string GuestPhone { get; set; } = string.Empty;
        public string VerificationStatus { get; set; } = string.Empty;
        public DateTime? VerifiedAt { get; set; }
        public string ConversationKey { get; set; } = string.Empty;
        public int? AssignedAdminUserId { get; set; }
        public string AssignedAdminName { get; set; } = string.Empty;
    }
}
