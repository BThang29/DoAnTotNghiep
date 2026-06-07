using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Reviews;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
    public class ReviewEntityToDto : Profile
    {
        public ReviewEntityToDto()
        {
            CreateMap<Review, ClientReviewResultDto>()
                .ForMember(dest => dest.ReviewId, opt => opt.MapFrom(src => src.id))
                .ForMember(dest => dest.BookingId, opt => opt.MapFrom(src => src.booking_id))
                .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.rating))
                .ForMember(dest => dest.Feedback, opt => opt.MapFrom(src => src.feedback))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.created_at))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.updated_at));
        }
    }
}
