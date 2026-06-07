using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Bookings;
using DoAnWebQuanLyKhachSan.Service.Dtos.Customers;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class BookingRoomDtoToEntity : Profile
	{
		public BookingRoomDtoToEntity()
		{
			CreateMap<BookingCreateDto, Booking>()
				.ForMember(dest => dest.id, mo => mo.Ignore())
				.ForMember(dest => dest.user_id, mo => mo.Ignore())
				.ForMember(dest => dest.room_id, mo => mo.MapFrom(src => src.RoomId))
				.ForMember(dest => dest.date_start, mo => mo.MapFrom(src => src.DateStart))
				.ForMember(dest => dest.date_end, mo => mo.MapFrom(src => src.DateEnd))
				.ForMember(dest => dest.deposit, mo => mo.MapFrom(src => src.Deposit))
				.ForMember(dest => dest.voucher_id, mo => mo.MapFrom(src => src.VoucherId));

			CreateMap<BookingGridDto, Booking>();
			CreateMap<BookingDetailDto, Booking>();
		}
	}

	public class BookingRoomEntityToDto : Profile
	{
		public BookingRoomEntityToDto()
		{
			CreateMap<Booking, BookingCreateDto>()
				.ForMember(dest => dest.id, mo => mo.MapFrom(src => src.id));

			CreateMap<BookingGridView, BookingGridDto>()
				.ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.CustomerName))
				.ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.RoomName));

			CreateMap<BookingGridView, BookingDetailDto>()
				.ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.CustomerName))
				.ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.RoomName));

			CreateMap<BookingDetailView, BookingDetailDto>();
		}
	}
}
