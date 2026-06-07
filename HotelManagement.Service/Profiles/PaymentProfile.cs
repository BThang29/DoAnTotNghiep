using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Payments;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class PaymentDtoToEntity : Profile
	{
		public PaymentDtoToEntity()
		{
			CreateMap<PaymentCreateDto, Payment>();
			CreateMap<PaymentUpdateDto, Payment>();
		}
	}

	public class PaymentEntityToDto : Profile
	{
		public PaymentEntityToDto()
		{
			CreateMap<PaymentGridView, PaymentGridDto>();
			CreateMap<PaymentGridView, PaymentDetailDto>();
		}
	}
}
