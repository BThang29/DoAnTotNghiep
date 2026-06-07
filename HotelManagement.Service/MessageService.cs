using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Messages;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
    public class MessageService
    {
        private readonly HotelManagementRepository _repository;
        private readonly BaseService _baseService;

        public MessageService(HotelManagementRepository repository, IMapper mapper)
        {
            _repository = repository;
            _baseService = new BaseService(repository, mapper);
        }

        public async Task<PagingResult<MessageGridDto>> GetMessages(MessageGridPagingDto pagingModel)
        {
            pagingModel ??= new MessageGridPagingDto();
            return await _baseService.FilterPagedAsync<Message, MessageGridDto>(pagingModel);
        }

        public async Task<MessageDetailDto?> GetMessageById(int id)
        {
            return await _baseService.FindAsync<Message, MessageDetailDto>(x => x.Id == id);
        }

        public async Task<int> CreateMessage(MessageCreateDto model)
        {
            var createDate = model.CreateDate ?? DateTime.Now;
            var assignedAdminUserId = model.AssignedAdminUserId ?? model.UserId;
            var conversationKey = ResolveConversationKey(model.ConversationKey, model.CustomerId, model.GuestToken, assignedAdminUserId);
            var conversation = await EnsureConversationAsync(model.ConversationId, conversationKey, model.CustomerId, model.CustomerName, model.GuestToken, assignedAdminUserId, createDate);

            var entity = new Message
            {
                conversationId = conversation.id,
                customerName = model.CustomerName.Trim(),
                userid = assignedAdminUserId ?? model.UserId ?? 0,
                customerId = model.CustomerId,
                guestToken = NormalizeOptionalText(model.GuestToken),
                assignedAdminUserId = assignedAdminUserId,
                senderUserId = model.SenderUserId,
                senderRole = NormalizeSenderRole(model.SenderRole),
                conversationKey = conversationKey,
                createDate = createDate,
                content = model.Content.Trim(),
                seen = model.Seen,
                seenDate = model.Seen ? (model.SeenDate ?? createDate) : null
            };

            GetDbContext().Messages.Add(entity);
            await GetDbContext().SaveChangesAsync();
            return entity.id;
        }

        public async Task<bool> UpdateMessage(int id, MessageUpdateDto model)
        {
            var entity = await GetDbContext().Messages.FirstOrDefaultAsync(x => x.id == id);
            if (entity == null)
            {
                return false;
            }

            var assignedAdminUserId = model.AssignedAdminUserId ?? model.UserId;
            var conversationKey = ResolveConversationKey(model.ConversationKey, model.CustomerId, model.GuestToken, assignedAdminUserId, entity.conversationKey);
            var conversation = await EnsureConversationAsync(model.ConversationId ?? entity.conversationId, conversationKey, model.CustomerId, model.CustomerName, model.GuestToken, assignedAdminUserId, model.CreateDate ?? entity.createDate);

            entity.conversationId = conversation.id;
            entity.customerName = model.CustomerName.Trim();
            entity.userid = assignedAdminUserId ?? model.UserId ?? entity.userid;
            entity.customerId = model.CustomerId;
            entity.guestToken = NormalizeOptionalText(model.GuestToken);
            entity.assignedAdminUserId = assignedAdminUserId;
            entity.senderUserId = model.SenderUserId;
            entity.senderRole = NormalizeSenderRole(model.SenderRole);
            entity.conversationKey = conversationKey;
            entity.createDate = model.CreateDate ?? entity.createDate;
            entity.content = model.Content.Trim();
            entity.seen = model.Seen;
            entity.seenDate = model.Seen ? (model.SeenDate ?? entity.seenDate ?? DateTime.Now) : null;

            await GetDbContext().SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateSeenStatus(int id, bool seen)
        {
            var entity = await GetDbContext().Messages.FirstOrDefaultAsync(x => x.id == id);
            if (entity == null)
            {
                return false;
            }

            entity.seen = seen;
            entity.seenDate = seen ? DateTime.Now : null;
            await GetDbContext().SaveChangesAsync();
            return true;
        }

        public async Task<int?> DeleteMessage(int id)
        {
            var entity = await GetDbContext().Messages.FirstOrDefaultAsync(x => x.id == id);
            if (entity == null)
            {
                return null;
            }

            GetDbContext().Messages.Remove(entity);
            await GetDbContext().SaveChangesAsync();
            return id;
        }

        private HotelManagementContext GetDbContext()
        {
            return _repository.GetDbContext<HotelManagementContext>();
        }

        private static string NormalizeSenderRole(string? senderRole)
        {
            return string.Equals(senderRole?.Trim(), "Admin", StringComparison.OrdinalIgnoreCase)
                ? "Admin"
                : "Customer";
        }

        private static string? NormalizeOptionalText(string? value)
        {
            var normalizedValue = value?.Trim();
            return string.IsNullOrWhiteSpace(normalizedValue) ? null : normalizedValue;
        }

        private static string ResolveConversationKey(string? requestedConversationKey, int? customerId, string? guestToken, int? assignedAdminUserId, string? fallbackConversationKey = null)
        {
            var conversationKey = NormalizeOptionalText(requestedConversationKey);
            if (!string.IsNullOrWhiteSpace(conversationKey))
            {
                return conversationKey;
            }

            if (customerId.HasValue && customerId.Value > 0)
            {
                return $"customer:{customerId.Value}";
            }

            var normalizedGuestToken = NormalizeOptionalText(guestToken);
            if (!string.IsNullOrWhiteSpace(normalizedGuestToken))
            {
                return $"guest:{normalizedGuestToken}";
            }

            var normalizedFallback = NormalizeOptionalText(fallbackConversationKey);
            if (!string.IsNullOrWhiteSpace(normalizedFallback))
            {
                return normalizedFallback;
            }

            return $"conversation:{Guid.NewGuid():N}";
        }

        private async Task<ChatConversation> EnsureConversationAsync(int? requestedConversationId, string conversationKey, int? customerId, string customerName, string? guestToken, int? assignedAdminUserId, DateTime createdDate)
        {
            if (requestedConversationId.HasValue && requestedConversationId.Value > 0)
            {
                var existingConversation = await GetDbContext().ChatConversations.FirstOrDefaultAsync(x => x.id == requestedConversationId.Value);
                if (existingConversation != null)
                {
                    return existingConversation;
                }
            }

            var existingByKey = await GetDbContext().ChatConversations.FirstOrDefaultAsync(x => x.conversationKey == conversationKey);
            if (existingByKey != null)
            {
                return existingByKey;
            }

            var conversation = new ChatConversation
            {
                conversationKey = conversationKey,
                customerId = customerId,
                guestSessionToken = NormalizeOptionalText(guestToken),
                guestDisplayName = customerId.HasValue && customerId.Value > 0 ? null : NormalizeOptionalText(customerName) ?? "Khach vang lai",
                verificationStatus = customerId.HasValue && customerId.Value > 0 ? "Verified" : "Unverified",
                assignedAdminUserId = assignedAdminUserId,
                createdDate = createdDate
            };

            GetDbContext().ChatConversations.Add(conversation);
            await GetDbContext().SaveChangesAsync();
            return conversation;
        }
    }
}
