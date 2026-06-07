using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Messages
{
    public class MessageGridPagingDto : PagingParams<MessageGridDto>
    {
        public string? Keyword { get; set; }
        public int? UserId { get; set; }
        public int? CustomerId { get; set; }
        public int? AssignedAdminUserId { get; set; }
        public string? GuestToken { get; set; }
        public string? ConversationKey { get; set; }
        public string? SenderRole { get; set; }

        public override List<Expression<Func<MessageGridDto, bool>>> GetPredicates()
        {
            var predicates = new List<Expression<Func<MessageGridDto, bool>>>();

            if (UserId.HasValue && UserId.Value > 0)
            {
                var userId = UserId.Value;
                predicates.Add(x => x.UserId == userId);
            }

            if (CustomerId.HasValue && CustomerId.Value > 0)
            {
                var customerId = CustomerId.Value;
                predicates.Add(x => x.CustomerId == customerId);
            }

            if (AssignedAdminUserId.HasValue && AssignedAdminUserId.Value > 0)
            {
                var assignedAdminUserId = AssignedAdminUserId.Value;
                predicates.Add(x => x.AssignedAdminUserId == assignedAdminUserId);
            }

            if (!string.IsNullOrWhiteSpace(GuestToken))
            {
                var guestToken = GuestToken.Trim();
                predicates.Add(x => x.GuestToken == guestToken);
            }

            if (!string.IsNullOrWhiteSpace(ConversationKey))
            {
                var conversationKey = ConversationKey.Trim();
                predicates.Add(x => x.ConversationKey == conversationKey);
            }

            if (!string.IsNullOrWhiteSpace(SenderRole))
            {
                var senderRole = SenderRole.Trim();
                predicates.Add(x => x.SenderRole == senderRole);
            }

            if (!string.IsNullOrWhiteSpace(Keyword))
            {
                var keyword = Keyword.Trim();
                predicates.Add(x =>
                    x.CustomerName.Contains(keyword) ||
                    x.ConversationKey.Contains(keyword) ||
                    x.Content.Contains(keyword));
            }

            return predicates;
        }
    }
}
