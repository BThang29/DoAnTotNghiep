using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Messages;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
    public class MessageDtoToEntity : Profile
    {
        public MessageDtoToEntity()
        {
            CreateMap<MessageCreateDto, Message>()
                .ForMember(dest => dest.id, mo => mo.MapFrom(src => src.Id))
                .ForMember(dest => dest.conversationId, mo => mo.MapFrom(src => src.ConversationId ?? 0))
                .ForMember(dest => dest.customerName, mo => mo.MapFrom(src => src.CustomerName))
                .ForMember(dest => dest.userid, mo => mo.MapFrom(src => src.UserId ?? 0))
                .ForMember(dest => dest.customerId, mo => mo.MapFrom(src => src.CustomerId))
                .ForMember(dest => dest.guestToken, mo => mo.MapFrom(src => src.GuestToken))
                .ForMember(dest => dest.assignedAdminUserId, mo => mo.MapFrom(src => src.AssignedAdminUserId))
                .ForMember(dest => dest.senderUserId, mo => mo.MapFrom(src => src.SenderUserId))
                .ForMember(dest => dest.senderRole, mo => mo.MapFrom(src => src.SenderRole))
                .ForMember(dest => dest.conversationKey, mo => mo.MapFrom(src => src.ConversationKey))
                .ForMember(dest => dest.createDate, mo => mo.MapFrom(src => src.CreateDate ?? default))
                .ForMember(dest => dest.content, mo => mo.MapFrom(src => src.Content))
                .ForMember(dest => dest.seen, mo => mo.MapFrom(src => src.Seen))
                .ForMember(dest => dest.seenDate, mo => mo.MapFrom(src => src.SeenDate));

            CreateMap<MessageUpdateDto, Message>()
                .ForMember(dest => dest.conversationId, mo => mo.MapFrom(src => src.ConversationId ?? 0))
                .ForMember(dest => dest.customerName, mo => mo.MapFrom(src => src.CustomerName))
                .ForMember(dest => dest.userid, mo => mo.MapFrom(src => src.UserId ?? 0))
                .ForMember(dest => dest.customerId, mo => mo.MapFrom(src => src.CustomerId))
                .ForMember(dest => dest.guestToken, mo => mo.MapFrom(src => src.GuestToken))
                .ForMember(dest => dest.assignedAdminUserId, mo => mo.MapFrom(src => src.AssignedAdminUserId))
                .ForMember(dest => dest.senderUserId, mo => mo.MapFrom(src => src.SenderUserId))
                .ForMember(dest => dest.senderRole, mo => mo.MapFrom(src => src.SenderRole))
                .ForMember(dest => dest.conversationKey, mo => mo.MapFrom(src => src.ConversationKey))
                .ForMember(dest => dest.createDate, mo => mo.MapFrom(src => src.CreateDate ?? default))
                .ForMember(dest => dest.content, mo => mo.MapFrom(src => src.Content))
                .ForMember(dest => dest.seen, mo => mo.MapFrom(src => src.Seen))
                .ForMember(dest => dest.seenDate, mo => mo.MapFrom(src => src.SeenDate));
        }
    }

    public class MessageEntityToDto : Profile
    {
        public MessageEntityToDto()
        {
            CreateMap<Message, MessageGridDto>()
                .ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
                .ForMember(dest => dest.ConversationId, mo => mo.MapFrom(src => src.conversationId))
                .ForMember(dest => dest.CustomerName, mo => mo.MapFrom(src => src.customerName))
                .ForMember(dest => dest.UserId, mo => mo.MapFrom(src => src.userid))
                .ForMember(dest => dest.CustomerId, mo => mo.MapFrom(src => src.customerId))
                .ForMember(dest => dest.GuestToken, mo => mo.MapFrom(src => src.guestToken))
                .ForMember(dest => dest.AssignedAdminUserId, mo => mo.MapFrom(src => src.assignedAdminUserId))
                .ForMember(dest => dest.SenderUserId, mo => mo.MapFrom(src => src.senderUserId))
                .ForMember(dest => dest.SenderRole, mo => mo.MapFrom(src => src.senderRole))
                .ForMember(dest => dest.ConversationKey, mo => mo.MapFrom(src => src.conversationKey))
                .ForMember(dest => dest.CreateDate, mo => mo.MapFrom(src => src.createDate))
                .ForMember(dest => dest.Content, mo => mo.MapFrom(src => src.content))
                .ForMember(dest => dest.Seen, mo => mo.MapFrom(src => src.seen))
                .ForMember(dest => dest.SeenDate, mo => mo.MapFrom(src => src.seenDate));

            CreateMap<Message, MessageDetailDto>()
                .ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
                .ForMember(dest => dest.ConversationId, mo => mo.MapFrom(src => src.conversationId))
                .ForMember(dest => dest.CustomerName, mo => mo.MapFrom(src => src.customerName))
                .ForMember(dest => dest.UserId, mo => mo.MapFrom(src => src.userid))
                .ForMember(dest => dest.CustomerId, mo => mo.MapFrom(src => src.customerId))
                .ForMember(dest => dest.GuestToken, mo => mo.MapFrom(src => src.guestToken))
                .ForMember(dest => dest.AssignedAdminUserId, mo => mo.MapFrom(src => src.assignedAdminUserId))
                .ForMember(dest => dest.SenderUserId, mo => mo.MapFrom(src => src.senderUserId))
                .ForMember(dest => dest.SenderRole, mo => mo.MapFrom(src => src.senderRole))
                .ForMember(dest => dest.ConversationKey, mo => mo.MapFrom(src => src.conversationKey))
                .ForMember(dest => dest.CreateDate, mo => mo.MapFrom(src => src.createDate))
                .ForMember(dest => dest.Content, mo => mo.MapFrom(src => src.content))
                .ForMember(dest => dest.Seen, mo => mo.MapFrom(src => src.seen))
                .ForMember(dest => dest.SeenDate, mo => mo.MapFrom(src => src.seenDate));
        }
    }
}
