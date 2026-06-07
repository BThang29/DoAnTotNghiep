using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Rooms;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class RoomDtoToEntity : Profile
	{
		public RoomDtoToEntity()
		{
			CreateMap<RoomCreateDto, Room>()
				.ForMember(dest => dest.room_name, mo => mo.MapFrom(src => src.RoomName.Trim()))
				.ForMember(dest => dest.price, mo => mo.MapFrom(src => src.Price))
				.ForMember(dest => dest.roomtype_id, mo => mo.MapFrom(src => src.RoomTypeId))
				.ForMember(dest => dest.room_status, mo => mo.MapFrom(src => src.RoomStatusId));
			CreateMap<RoomUpdateDto, Room>()
				.ForMember(dest => dest.room_name, mo => mo.MapFrom(src => src.RoomName.Trim()))
				.ForMember(dest => dest.price, mo => mo.MapFrom(src => src.Price))
				.ForMember(dest => dest.roomtype_id, mo => mo.MapFrom(src => src.RoomTypeId))
				.ForMember(dest => dest.room_status, mo => mo.MapFrom(src => src.RoomStatusId));

			CreateMap<RoomTypeUpdateDto, RoomType>()
				.ForMember(dest => dest.details, mo => mo.MapFrom(src => src.Details));

			CreateMap<RoomTypeCreateDto, RoomType>()
				.ForMember(dest => dest.id, mo => mo.MapFrom(src => src.Id))
				.ForMember(dest => dest.details, mo => mo.MapFrom(src => src.Details));
		}
	}

	public class RoomEntityToDto : Profile
	{
		public RoomEntityToDto()
		{
			CreateMap<RoomGridView, RoomGridDto>();
			CreateMap<RoomGridView, RoomDetailDto>();
			CreateMap<RoomType, RoomTypeDto>()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.Name, mo => mo.MapFrom(src => src.details ?? string.Empty));
			CreateMap<RoomStatus, RoomStatusDto>()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.Name, mo => mo.MapFrom(src => src.details ?? string.Empty));

			CreateMap<Room, RoomCreateDto>()
				.ForMember(dest => dest.id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.RoomName, mo => mo.MapFrom(src => src.room_name.Trim()))
				.ForMember(dest => dest.Price, mo => mo.MapFrom(src => src.price))
				.ForMember(dest => dest.RoomTypeId, mo => mo.MapFrom(src => src.roomtype_id))
				.ForMember(dest => dest.RoomStatusId, mo => mo.MapFrom(src => src.room_status));

			CreateMap<Room, RoomUpdateDto>()
				.ForMember(dest => dest.RoomName, mo => mo.MapFrom(src => src.room_name.Trim()))
				.ForMember(dest => dest.Price, mo => mo.MapFrom(src => src.price))
				.ForMember(dest => dest.RoomTypeId, mo => mo.MapFrom(src => src.roomtype_id))
				.ForMember(dest => dest.RoomStatusId, mo => mo.MapFrom(src => src.room_status));

			CreateMap<RoomType, RoomTypeUpdateDto>()
				.ForMember(dest => dest.Details, mo => mo.MapFrom(src => src.details));

			CreateMap<RoomType, RoomTypeCreateDto>()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.Details, mo => mo.MapFrom(src => src.details));
		}
	}
}
