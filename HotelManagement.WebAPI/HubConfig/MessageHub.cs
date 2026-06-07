using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.Service.Dtos.Chat;
using Microsoft.AspNetCore.SignalR;

namespace DoAnWebQuanLyKhachSan.API.HubConfig
{
    public class MessageHub : Hub
    {
        private readonly ChatService _chatService;

        public MessageHub(ChatService chatService)
        {
            _chatService = chatService;
        }

        public override async Task OnConnectedAsync()
        {
            var userIdentity = new UserIdentity(Context.User);
            var userId = userIdentity.UserId;
            var guestToken = ResolveGuestToken();
            if (userId > 0)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroup(userId));
                if (userIdentity.IsAdministrator)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, BuildAdminGroup(userId));
                    await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
                }

                var customerId = await _chatService.ResolveCustomerIdByUserIdAsync(userId);
                if (customerId.HasValue && customerId.Value > 0)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, BuildConversationGroup(BuildCustomerGroup(customerId.Value)));
                }
            }
            else if (!string.IsNullOrWhiteSpace(guestToken))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, BuildConversationGroup(BuildGuestGroup(guestToken)));
            }

            await base.OnConnectedAsync();
        }

        public async Task JoinConversation(string conversationKey)
        {
            if (string.IsNullOrWhiteSpace(conversationKey))
            {
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, BuildConversationGroup(conversationKey.Trim()));
        }

        public async Task<ChatMessageDto?> SendCustomerMessage(string content, string? guestToken = null)
        {
            var userId = ResolveUserId();
            var resolvedGuestToken = userId > 0 ? null : (string.IsNullOrWhiteSpace(guestToken) ? ResolveGuestToken() : guestToken);
            if ((userId <= 0 && string.IsNullOrWhiteSpace(resolvedGuestToken)) || string.IsNullOrWhiteSpace(content))
            {
                return null;
            }

            var message = await _chatService.SendCustomerMessageAsync(userId > 0 ? userId : null, resolvedGuestToken, content);
            if (message == null)
            {
                return null;
            }

            await BroadcastConversationAsync(message);
            return message;
        }

        public async Task<ChatMessageDto?> SendAdminMessage(string conversationKey, string content)
        {
            var adminUserId = ResolveUserId();
            if (adminUserId <= 0 || string.IsNullOrWhiteSpace(conversationKey) || string.IsNullOrWhiteSpace(content))
            {
                return null;
            }

            var message = await _chatService.SendAdminMessageAsync(adminUserId, conversationKey, content);
            if (message == null)
            {
                return null;
            }

            await BroadcastConversationAsync(message);
            return message;
        }

        public async Task BroadcastThreadUpdatedAsync(string conversationKey)
        {
            var thread = await _chatService.GetAdminThreadByConversationKeyAsync(conversationKey);
            if (thread == null)
            {
                return;
            }

            await Clients.Group("admins").SendAsync("ChatThreadUpdated", thread);
        }

        private async Task BroadcastConversationAsync(ChatMessageDto message)
        {
            await Clients.Group(BuildConversationGroup(message.ConversationKey)).SendAsync("ChatMessageReceived", message);
            await Clients.Group("admins").SendAsync("ChatMessageReceived", message);
            await BroadcastThreadUpdatedAsync(message.ConversationKey);

            if (message.AssignedAdminUserId.HasValue && message.AssignedAdminUserId.Value > 0)
            {
                await Clients.Group(BuildAdminGroup(message.AssignedAdminUserId.Value)).SendAsync("ChatMessageReceived", message);
            }
        }

        private int ResolveUserId()
        {
            var userIdentity = new UserIdentity(Context.User);
            return userIdentity.UserId;
        }

        private static string BuildUserGroup(int userId)
        {
            return $"user:{userId}";
        }

        private static string BuildAdminGroup(int adminUserId)
        {
            return $"admin:{adminUserId}";
        }

        private static string BuildCustomerGroup(int customerId)
        {
            return $"customer:{customerId}";
        }

        private static string BuildGuestGroup(string guestToken)
        {
            return $"guest:{guestToken.Trim()}";
        }

        private static string BuildConversationGroup(string conversationKey)
        {
            return $"conversation:{conversationKey}";
        }

        private string? ResolveGuestToken()
        {
            return Context.GetHttpContext()?.Request.Query["guestToken"].FirstOrDefault();
        }
    }
}
