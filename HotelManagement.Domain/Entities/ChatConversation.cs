using System;
using System.Collections.Generic;

namespace DoAnWebQuanLyKhachSan.Data.Entities
{
    public partial class ChatConversation
    {
        public int id { get; set; }
        public string conversationKey { get; set; } = string.Empty;
        public int? customerId { get; set; }
        public string? guestSessionToken { get; set; }
        public string? guestDisplayName { get; set; }
        public string? guestEmail { get; set; }
        public string? guestPhone { get; set; }
        public string verificationStatus { get; set; } = "Unverified";
        public string? verificationCode { get; set; }
        public DateTime? verificationCodeExpiresAt { get; set; }
        public DateTime? verifiedAt { get; set; }
        public int? assignedAdminUserId { get; set; }
        public DateTime createdDate { get; set; }
        public DateTime? lastMessageDate { get; set; }
        public string? lastMessagePreview { get; set; }

        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
