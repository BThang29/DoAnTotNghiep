using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Chat;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
    public class ChatService
    {
        private const string VerificationStatusUnverified = "Unverified";
        private const string VerificationStatusPending = "PendingEmailVerification";
        private const string VerificationStatusVerified = "Verified";

        private readonly HotelManagementRepository _repository;
        private readonly EmailService _emailService;

        public ChatService(HotelManagementRepository repository, EmailService emailService)
        {
            _repository = repository;
            _emailService = emailService;
        }

        public async Task<ChatClientContextDto?> GetClientContextAsync(int? userId, string? guestToken)
        {
            var conversation = await GetOrCreateConversationAsync(userId, guestToken);
            if (conversation == null)
            {
                return null;
            }

            return await BuildClientContextAsync(conversation);
        }

        public async Task<List<ChatMessageDto>> GetClientMessagesAsync(int? userId, string? guestToken)
        {
            var conversation = await GetOrCreateConversationAsync(userId, guestToken);
            if (conversation == null)
            {
                return new List<ChatMessageDto>();
            }

            return await GetMessagesByConversationIdAsync(conversation.id);
        }

        public async Task<ChatConversationBootstrapDto?> ResolveGuestConversationAsync(string guestToken, ChatGuestConversationResolveDto model)
        {
            var normalizedGuestToken = NormalizeOptionalText(guestToken);
            var normalizedGuestName = NormalizeOptionalText(model.GuestDisplayName);
            var normalizedGuestEmail = NormalizeEmail(model.GuestEmail);
            var normalizedGuestPhone = NormalizePhone(model.GuestPhone);
            if (string.IsNullOrWhiteSpace(normalizedGuestToken)
                || string.IsNullOrWhiteSpace(normalizedGuestName)
                || string.IsNullOrWhiteSpace(normalizedGuestEmail)
                || string.IsNullOrWhiteSpace(normalizedGuestPhone))
            {
                return null;
            }

            var conversationByToken = await FindGuestConversationByGuestTokenAsync(normalizedGuestToken);
            var conversationByContact = await FindGuestConversationByContactAsync(normalizedGuestEmail, normalizedGuestPhone);
            var matchedByToken = conversationByToken != null;
            var matchedByContact = conversationByToken == null && conversationByContact != null;
            var matchedExistingConversation = matchedByToken || matchedByContact;
            var conversation = conversationByToken ?? conversationByContact ?? new ChatConversation
            {
                conversationKey = BuildGuestConversationKey(normalizedGuestToken),
                customerId = null,
                verificationStatus = VerificationStatusUnverified,
                createdDate = DateTime.Now
            };

            if (!matchedExistingConversation)
            {
                GetDbContext().ChatConversations.Add(conversation);
            }

            if (!matchedByContact)
            {
                conversation.guestDisplayName = normalizedGuestName;
                conversation.guestEmail = normalizedGuestEmail;
                conversation.guestPhone = normalizedGuestPhone;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(conversation.guestDisplayName))
                {
                    conversation.guestDisplayName = normalizedGuestName;
                }

                if (string.IsNullOrWhiteSpace(conversation.guestEmail))
                {
                    conversation.guestEmail = normalizedGuestEmail;
                }

                if (string.IsNullOrWhiteSpace(conversation.guestPhone))
                {
                    conversation.guestPhone = normalizedGuestPhone;
                }
            }

            await RebindGuestTokenAsync(conversation, normalizedGuestToken);

            if (!conversation.lastMessageDate.HasValue)
            {
                conversation.lastMessageDate = DateTime.Now;
            }

            if (string.IsNullOrWhiteSpace(conversation.lastMessagePreview))
            {
                conversation.lastMessagePreview = "Khach bat dau phien chat.";
            }

            await GetDbContext().SaveChangesAsync();

            return new ChatConversationBootstrapDto
            {
                Context = await BuildClientContextAsync(conversation),
                Messages = await GetMessagesByConversationIdAsync(conversation.id),
                MatchedExistingConversation = matchedExistingConversation
            };
        }

        public async Task<List<ChatThreadDto>> GetAdminThreadsAsync(string? keyword)
        {
            var conversations = await BuildConversationQuery().ToListAsync();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var normalizedKeyword = keyword.Trim().ToLowerInvariant();
                conversations = conversations
                    .Where(x => x.CustomerName.ToLowerInvariant().Contains(normalizedKeyword)
                        || x.LastMessage.ToLowerInvariant().Contains(normalizedKeyword)
                        || x.GuestEmail.ToLowerInvariant().Contains(normalizedKeyword)
                        || x.GuestPhone.ToLowerInvariant().Contains(normalizedKeyword))
                    .ToList();
            }

            return conversations
                .OrderByDescending(x => x.LastMessageDate)
                .ToList();
        }

        public async Task<ChatThreadDto?> GetAdminThreadByConversationKeyAsync(string conversationKey)
        {
            var normalizedConversationKey = NormalizeOptionalText(conversationKey);
            if (string.IsNullOrWhiteSpace(normalizedConversationKey))
            {
                return null;
            }

            return await BuildConversationQuery()
                .FirstOrDefaultAsync(x => x.ConversationKey == normalizedConversationKey);
        }

        public async Task<List<ChatMessageDto>> GetAdminMessagesAsync(string conversationKey)
        {
            var conversation = await FindConversationByKeyAsync(conversationKey);
            if (conversation == null)
            {
                return new List<ChatMessageDto>();
            }

            return await BuildMessageQuery()
                .Where(x => x.ConversationId == conversation.id)
                .OrderBy(x => x.CreateDate)
                .ToListAsync();
        }

        public async Task<ChatMessageDto?> SendCustomerMessageAsync(int? userId, string? guestToken, string content)
        {
            var conversation = await GetOrCreateConversationAsync(userId, guestToken);
            if (conversation == null)
            {
                return null;
            }

            var trimmedContent = content.Trim();
            if (string.IsNullOrWhiteSpace(trimmedContent))
            {
                return null;
            }

            var senderUserId = userId.HasValue && userId.Value > 0 ? userId : null;
            var conversationDisplayName = await ResolveConversationDisplayNameAsync(conversation);
            var entity = new Message
            {
                conversationId = conversation.id,
                customerName = conversationDisplayName,
                userid = userId ?? 0,
                customerId = conversation.customerId,
                guestToken = conversation.guestSessionToken,
                assignedAdminUserId = conversation.assignedAdminUserId,
                senderUserId = senderUserId,
                senderRole = "Customer",
                conversationKey = conversation.conversationKey,
                createDate = DateTime.Now,
                content = trimmedContent,
                seen = false
            };

            GetDbContext().Messages.Add(entity);
            await TouchConversationAfterMessageAsync(conversation, trimmedContent, entity.createDate);
            await GetDbContext().SaveChangesAsync();
            return await FindMessageAsync(entity.id);
        }

        public async Task<ChatMessageDto?> SendAdminMessageAsync(int adminUserId, string conversationKey, string content)
        {
            var admin = await GetDbContext().Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == adminUserId);
            if (admin == null)
            {
                return null;
            }

            var conversation = await FindConversationByKeyAsync(conversationKey);
            if (conversation == null)
            {
                return null;
            }

            var trimmedContent = content.Trim();
            if (string.IsNullOrWhiteSpace(trimmedContent))
            {
                return null;
            }

            var pendingMessages = await GetDbContext().Messages
                .Where(x => x.conversationId == conversation.id && x.assignedAdminUserId == null)
                .ToListAsync();

            foreach (var pendingMessage in pendingMessages)
            {
                pendingMessage.assignedAdminUserId = adminUserId;
            }

            conversation.assignedAdminUserId = adminUserId;
            var conversationDisplayName = await ResolveConversationDisplayNameAsync(conversation);

            var entity = new Message
            {
                conversationId = conversation.id,
                customerName = conversationDisplayName,
                userid = conversation.customerId.HasValue ? await ResolveConversationUserIdAsync(conversation.customerId.Value) : 0,
                customerId = conversation.customerId,
                guestToken = conversation.guestSessionToken,
                assignedAdminUserId = adminUserId,
                senderUserId = adminUserId,
                senderRole = "Admin",
                conversationKey = conversation.conversationKey,
                createDate = DateTime.Now,
                content = trimmedContent,
                seen = false
            };

            GetDbContext().Messages.Add(entity);
            await TouchConversationAfterMessageAsync(conversation, trimmedContent, entity.createDate);
            await GetDbContext().SaveChangesAsync();
            return await FindMessageAsync(entity.id);
        }

        public async Task MarkCustomerMessagesAsSeenByAdminAsync(string conversationKey)
        {
            var conversation = await FindConversationByKeyAsync(conversationKey);
            if (conversation == null)
            {
                return;
            }

            var messages = await GetDbContext().Messages
                .Where(x => x.conversationId == conversation.id && x.senderRole == "Customer" && !x.seen)
                .ToListAsync();

            if (!messages.Any())
            {
                return;
            }

            foreach (var message in messages)
            {
                message.seen = true;
                message.seenDate = DateTime.Now;
            }

            await GetDbContext().SaveChangesAsync();
        }

        public async Task MarkAdminMessagesAsSeenByCustomerAsync(int? userId, string? guestToken)
        {
            var conversation = await GetOrCreateConversationAsync(userId, guestToken);
            if (conversation == null)
            {
                return;
            }

            var messages = await GetDbContext().Messages
                .Where(x => x.conversationId == conversation.id && x.senderRole == "Admin" && !x.seen)
                .ToListAsync();

            if (!messages.Any())
            {
                return;
            }

            foreach (var message in messages)
            {
                message.seen = true;
                message.seenDate = DateTime.Now;
            }

            await GetDbContext().SaveChangesAsync();
        }

        public async Task<int?> ResolveCustomerIdByUserIdAsync(int userId)
        {
            return await GetDbContext().Customers
                .AsNoTracking()
                .Where(x => x.userid == userId)
                .Select(x => (int?)x.id)
                .FirstOrDefaultAsync();
        }

        public async Task<ChatClientContextDto?> UpdateGuestProfileAsync(string guestToken, ChatGuestProfileDto model)
        {
            var conversation = await GetOrCreateGuestConversationAsync(guestToken);
            if (conversation == null)
            {
                return null;
            }

            conversation.guestDisplayName = NormalizeOptionalText(model.GuestDisplayName) ?? conversation.guestDisplayName;
            conversation.guestEmail = NormalizeEmail(model.GuestEmail);
            conversation.guestPhone = NormalizePhone(model.GuestPhone);

            if (!conversation.lastMessageDate.HasValue)
            {
                conversation.lastMessageDate = DateTime.Now;
            }

            if (string.IsNullOrWhiteSpace(conversation.lastMessagePreview))
            {
                conversation.lastMessagePreview = "Khach da de lai thong tin lien he.";
            }

            if (string.IsNullOrWhiteSpace(conversation.guestEmail) && conversation.verificationStatus == VerificationStatusVerified)
            {
                conversation.verificationStatus = VerificationStatusUnverified;
                conversation.verifiedAt = null;
            }

            await GetDbContext().SaveChangesAsync();
            return await BuildClientContextAsync(conversation);
        }

        public async Task<bool> RequestGuestEmailVerificationAsync(string guestToken, string email)
        {
            var conversation = await GetOrCreateGuestConversationAsync(guestToken);
            if (conversation == null)
            {
                return false;
            }

            var normalizedEmail = NormalizeOptionalText(email);
            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                return false;
            }

            var verificationCode = Random.Shared.Next(100000, 999999).ToString();
            conversation.guestEmail = normalizedEmail;
            conversation.verificationCode = verificationCode;
            conversation.verificationCodeExpiresAt = DateTime.Now.AddMinutes(10);
            conversation.verificationStatus = VerificationStatusPending;
            conversation.verifiedAt = null;

            await GetDbContext().SaveChangesAsync();

            await _emailService.SendGuestChatVerificationEmail(
                normalizedEmail,
                string.IsNullOrWhiteSpace(conversation.guestDisplayName) ? "Khach hang" : conversation.guestDisplayName,
                verificationCode);

            return true;
        }

        public async Task<ChatClientContextDto?> ConfirmGuestEmailVerificationAsync(string guestToken, string code)
        {
            var conversation = await GetOrCreateGuestConversationAsync(guestToken);
            if (conversation == null)
            {
                return null;
            }

            var normalizedCode = NormalizeOptionalText(code);
            if (string.IsNullOrWhiteSpace(normalizedCode)
                || !string.Equals(conversation.verificationCode, normalizedCode, StringComparison.Ordinal)
                || !conversation.verificationCodeExpiresAt.HasValue
                || conversation.verificationCodeExpiresAt.Value < DateTime.Now)
            {
                return null;
            }

            conversation.verificationStatus = VerificationStatusVerified;
            conversation.verifiedAt = DateTime.Now;
            conversation.verificationCode = null;
            conversation.verificationCodeExpiresAt = null;

            await GetDbContext().SaveChangesAsync();
            return await BuildClientContextAsync(conversation);
        }

        private IQueryable<ChatThreadDto> BuildConversationQuery()
        {
            var db = GetDbContext();
            var messageQuery = db.Messages.AsNoTracking();

            return from conversation in db.ChatConversations.AsNoTracking()
                   join customer in db.Customers.AsNoTracking() on conversation.customerId equals customer.id into customerGroup
                   from customer in customerGroup.DefaultIfEmpty()
                   join admin in db.Users.AsNoTracking() on conversation.assignedAdminUserId equals admin.Id into adminGroup
                   from admin in adminGroup.DefaultIfEmpty()
                   select new ChatThreadDto
                   {
                       CustomerId = conversation.customerId ?? 0,
                       UserId = customer != null && customer.userid.HasValue ? customer.userid.Value : 0,
                       CustomerName = customer != null
                           ? customer.fullname ?? string.Empty
                           : (conversation.guestDisplayName ?? "Khach vang lai"),
                       IsGuest = !conversation.customerId.HasValue,
                       GuestToken = conversation.guestSessionToken ?? string.Empty,
                       GuestEmail = conversation.guestEmail ?? string.Empty,
                       GuestPhone = conversation.guestPhone ?? string.Empty,
                       VerificationStatus = conversation.verificationStatus,
                       VerifiedAt = conversation.verifiedAt,
                       AssignedAdminUserId = conversation.assignedAdminUserId,
                       AssignedAdminName = admin != null ? admin.FullName ?? string.Empty : string.Empty,
                       ConversationKey = conversation.conversationKey,
                       LastMessage = conversation.lastMessagePreview ?? "Khach da de lai thong tin lien he.",
                       LastSenderRole = messageQuery
                           .Where(x => x.conversationId == conversation.id)
                           .OrderByDescending(x => x.createDate)
                           .Select(x => x.senderRole)
                           .FirstOrDefault() ?? string.Empty,
                       LastMessageDate = conversation.lastMessageDate ?? conversation.createdDate,
                       UnseenCount = messageQuery.Count(x => x.conversationId == conversation.id && x.senderRole == "Customer" && !x.seen)
                   };
        }

        private IQueryable<ChatMessageDto> BuildMessageQuery()
        {
            var db = GetDbContext();
            return from message in db.Messages.AsNoTracking()
                   join conversation in db.ChatConversations.AsNoTracking() on message.conversationId equals conversation.id
                   join customer in db.Customers.AsNoTracking() on conversation.customerId equals customer.id into customerGroup
                   from customer in customerGroup.DefaultIfEmpty()
                   join admin in db.Users.AsNoTracking() on conversation.assignedAdminUserId equals admin.Id into adminGroup
                   from admin in adminGroup.DefaultIfEmpty()
                   join sender in db.Users.AsNoTracking() on message.senderUserId equals sender.Id into senderGroup
                   from sender in senderGroup.DefaultIfEmpty()
                   select new ChatMessageDto
                   {
                       Id = message.id,
                       ConversationId = conversation.id,
                       UserId = customer != null && customer.userid.HasValue ? customer.userid.Value : 0,
                       CustomerId = conversation.customerId ?? 0,
                       CustomerName = customer != null
                           ? customer.fullname ?? string.Empty
                           : (conversation.guestDisplayName ?? "Khach vang lai"),
                       GuestToken = conversation.guestSessionToken ?? string.Empty,
                       AssignedAdminUserId = conversation.assignedAdminUserId,
                       AssignedAdminName = admin != null ? admin.FullName ?? string.Empty : string.Empty,
                       SenderUserId = message.senderUserId,
                       SenderRole = message.senderRole,
                       SenderName = sender != null
                           ? sender.FullName ?? sender.UserName ?? string.Empty
                           : (message.senderRole == "Customer"
                               ? (customer != null ? customer.fullname ?? string.Empty : conversation.guestDisplayName ?? "Khach vang lai")
                               : "Admin"),
                       ConversationKey = conversation.conversationKey,
                       CreateDate = message.createDate,
                       Content = message.content,
                       Seen = message.seen,
                       SeenDate = message.seenDate
                   };
        }

        private async Task<ChatMessageDto?> FindMessageAsync(int id)
        {
            return await BuildMessageQuery().FirstOrDefaultAsync(x => x.Id == id);
        }

        private async Task<ChatClientContextDto> BuildClientContextAsync(ChatConversation conversation)
        {
            var customer = conversation.customerId.HasValue
                ? await GetDbContext().Customers.AsNoTracking().FirstOrDefaultAsync(x => x.id == conversation.customerId.Value)
                : null;
            var assignedAdmin = conversation.assignedAdminUserId.HasValue
                ? await GetDbContext().Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == conversation.assignedAdminUserId.Value)
                : null;

            return new ChatClientContextDto
            {
                UserId = customer?.userid ?? 0,
                CustomerId = customer?.id ?? 0,
                CustomerName = customer?.fullname ?? (conversation.guestDisplayName ?? "Khach vang lai"),
                IsGuest = !conversation.customerId.HasValue,
                GuestToken = conversation.guestSessionToken ?? string.Empty,
                GuestEmail = conversation.guestEmail ?? string.Empty,
                GuestPhone = conversation.guestPhone ?? string.Empty,
                VerificationStatus = conversation.verificationStatus,
                VerifiedAt = conversation.verifiedAt,
                ConversationKey = conversation.conversationKey,
                AssignedAdminUserId = conversation.assignedAdminUserId,
                AssignedAdminName = assignedAdmin?.FullName ?? string.Empty
            };
        }

        private async Task<ChatConversation?> GetOrCreateConversationAsync(int? userId, string? guestToken)
        {
            if (userId.HasValue && userId.Value > 0)
            {
                var customer = await GetCustomerByUserIdAsync(userId.Value);
                if (customer == null)
                {
                    return null;
                }

                var existingConversation = await GetDbContext().ChatConversations
                    .FirstOrDefaultAsync(x => x.customerId == customer.id);
                if (existingConversation != null)
                {
                    return existingConversation;
                }

                var entity = new ChatConversation
                {
                    conversationKey = BuildCustomerConversationKey(customer.id),
                    customerId = customer.id,
                    guestSessionToken = null,
                    guestDisplayName = null,
                    guestEmail = null,
                    guestPhone = null,
                    verificationStatus = VerificationStatusVerified,
                    verifiedAt = DateTime.Now,
                    createdDate = DateTime.Now
                };

                GetDbContext().ChatConversations.Add(entity);
                await GetDbContext().SaveChangesAsync();
                return entity;
            }

            return await GetOrCreateGuestConversationAsync(guestToken);
        }

        private async Task<ChatConversation?> GetOrCreateGuestConversationAsync(string? guestToken)
        {
            var normalizedGuestToken = NormalizeOptionalText(guestToken);
            if (string.IsNullOrWhiteSpace(normalizedGuestToken))
            {
                return null;
            }

            var existingConversation = await FindGuestConversationByGuestTokenAsync(normalizedGuestToken);
            if (existingConversation != null)
            {
                return existingConversation;
            }

            var entity = new ChatConversation
            {
                conversationKey = BuildGuestConversationKey(normalizedGuestToken),
                customerId = null,
                guestSessionToken = normalizedGuestToken,
                guestDisplayName = "Khach vang lai",
                guestEmail = null,
                guestPhone = null,
                verificationStatus = VerificationStatusUnverified,
                createdDate = DateTime.Now
            };

            GetDbContext().ChatConversations.Add(entity);
            await GetDbContext().SaveChangesAsync();
            return entity;
        }

        private async Task<List<ChatMessageDto>> GetMessagesByConversationIdAsync(int conversationId)
        {
            return await BuildMessageQuery()
                .Where(x => x.ConversationId == conversationId)
                .OrderBy(x => x.CreateDate)
                .ToListAsync();
        }

        private async Task<ChatConversation?> FindConversationByKeyAsync(string conversationKey)
        {
            var normalizedConversationKey = NormalizeOptionalText(conversationKey);
            if (string.IsNullOrWhiteSpace(normalizedConversationKey))
            {
                return null;
            }

            return await GetDbContext().ChatConversations
                .FirstOrDefaultAsync(x => x.conversationKey == normalizedConversationKey);
        }

        private async Task<Customer?> GetCustomerByUserIdAsync(int userId)
        {
            return await GetDbContext().Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.userid == userId);
        }

        private async Task<ChatConversation?> FindGuestConversationByContactAsync(string? email, string? phone)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(phone))
            {
                return null;
            }

            var normalizedEmail = NormalizeEmail(email);
            var normalizedPhone = NormalizePhone(phone);
            if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(normalizedPhone))
            {
                return null;
            }

            var candidates = await GetDbContext().ChatConversations
                .Where(x => x.customerId == null
                    && x.guestEmail != null
                    && x.guestPhone != null)
                .OrderByDescending(x => x.lastMessageDate ?? x.createdDate)
                .ToListAsync();

            return candidates
                .Where(x => string.Equals(NormalizeEmail(x.guestEmail), normalizedEmail, StringComparison.Ordinal)
                    && string.Equals(NormalizePhone(x.guestPhone), normalizedPhone, StringComparison.Ordinal))
                .OrderByDescending(x => x.lastMessageDate ?? x.createdDate)
                .FirstOrDefault();
        }

        private async Task<ChatConversation?> FindGuestConversationByGuestTokenAsync(string guestToken)
        {
            var normalizedGuestToken = NormalizeOptionalText(guestToken);
            if (string.IsNullOrWhiteSpace(normalizedGuestToken))
            {
                return null;
            }

            var conversationKey = BuildGuestConversationKey(normalizedGuestToken);
            return await GetDbContext().ChatConversations
                .OrderByDescending(x => x.lastMessageDate ?? x.createdDate)
                .FirstOrDefaultAsync(x => x.guestSessionToken == normalizedGuestToken
                    || x.conversationKey == conversationKey);
        }

        private async Task RebindGuestTokenAsync(ChatConversation targetConversation, string guestToken)
        {
            var previousConversation = await GetDbContext().ChatConversations
                .FirstOrDefaultAsync(x => x.id != targetConversation.id && x.guestSessionToken == guestToken);
            if (previousConversation != null)
            {
                previousConversation.guestSessionToken = null;
            }

            targetConversation.guestSessionToken = guestToken;
        }

        private async Task<int> ResolveConversationUserIdAsync(int customerId)
        {
            return await GetDbContext().Customers
                .AsNoTracking()
                .Where(x => x.id == customerId)
                .Select(x => x.userid ?? 0)
                .FirstOrDefaultAsync();
        }

        private async Task TouchConversationAfterMessageAsync(ChatConversation conversation, string lastContent, DateTime createdDate)
        {
            conversation.lastMessageDate = createdDate;
            conversation.lastMessagePreview = lastContent.Length > 500
                ? lastContent[..500]
                : lastContent;

            if (conversation.customerId.HasValue && conversation.verificationStatus != VerificationStatusVerified)
            {
                conversation.verificationStatus = VerificationStatusVerified;
                conversation.verifiedAt = createdDate;
            }

            await Task.CompletedTask;
        }

        private async Task<string> ResolveConversationDisplayNameAsync(ChatConversation conversation)
        {
            if (conversation.customerId.HasValue && conversation.customerId.Value > 0)
            {
                var customerName = await GetDbContext().Customers
                    .AsNoTracking()
                    .Where(x => x.id == conversation.customerId.Value)
                    .Select(x => x.fullname)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrWhiteSpace(customerName))
                {
                    return customerName;
                }
            }

            return conversation.guestDisplayName ?? "Khach vang lai";
        }

        private static string BuildCustomerConversationKey(int customerId)
        {
            return $"customer:{customerId}";
        }

        private static string BuildGuestConversationKey(string guestToken)
        {
            return $"guest:{guestToken}";
        }

        private static string? NormalizeOptionalText(string? value)
        {
            var normalizedValue = value?.Trim();
            return string.IsNullOrWhiteSpace(normalizedValue) ? null : normalizedValue;
        }

        private static string? NormalizeEmail(string? value)
        {
            var normalizedValue = NormalizeOptionalText(value);
            return string.IsNullOrWhiteSpace(normalizedValue)
                ? null
                : normalizedValue.ToLowerInvariant();
        }

        private static string? NormalizePhone(string? value)
        {
            var normalizedValue = NormalizeOptionalText(value);
            if (string.IsNullOrWhiteSpace(normalizedValue))
            {
                return null;
            }

            var digits = new string(normalizedValue.Where(char.IsDigit).ToArray());
            return string.IsNullOrWhiteSpace(digits) ? normalizedValue : digits;
        }

        private HotelManagementContext GetDbContext()
        {
            return _repository.GetDbContext<HotelManagementContext>();
        }
    }
}
