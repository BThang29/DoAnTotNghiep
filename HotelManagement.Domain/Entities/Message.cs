using System;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class Message
    {
        public int id { get; set; }
        public int conversationId { get; set; }
        public string customerName { get; set; } = string.Empty;
        public int userid { get; set; }
        public int? customerId { get; set; }
        public string? guestToken { get; set; }
        public int? assignedAdminUserId { get; set; }
        public int? senderUserId { get; set; }
        public string senderRole { get; set; } = "Customer";
        public string conversationKey { get; set; } = string.Empty;
        public DateTime createDate { get; set; }
        public string content { get; set; } = string.Empty;
        public bool seen { get; set; }
        public DateTime? seenDate { get; set; }

        public virtual ChatConversation? Conversation { get; set; }
    }
}
