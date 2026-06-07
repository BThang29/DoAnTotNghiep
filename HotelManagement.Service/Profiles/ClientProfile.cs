using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.BookingHistories;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Bookings;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Payments;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Reviews;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Rooms;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class ClientEntityToDto : Profile
	{
		public ClientEntityToDto()
		{
			CreateMap<RoomGridView, ClientRoomDto>()
				.ForMember(dest => dest.IsAvailable, opt => opt.Ignore());

			CreateMap<BookingDetailView, ClientBookingDetailDto>();
			CreateMap<BookingDetailView, ClientBookingResultDto>()
				.ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.Id))
				.ForMember(dest => dest.CustomerId, opt => opt.MapFrom(src => src.CustomerId ?? 0))
				.ForMember(dest => dest.RoomId, opt => opt.MapFrom(src => src.RoomId ?? 0))
				.ForMember(dest => dest.GuestAccessToken, opt => opt.Ignore())
				.ForMember(dest => dest.DateStart, opt => opt.MapFrom(src => src.DateStart ?? DateTime.MinValue))
				.ForMember(dest => dest.DateEnd, opt => opt.MapFrom(src => src.DateEnd ?? DateTime.MinValue));

			CreateMap<ClientBookingHistoryView, ClientBookingHistoryDto>();
			CreateMap<ClientOnlinePaymentResultView, ClientOnlinePaymentResultDto>();
		}
	}
}
