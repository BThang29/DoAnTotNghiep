using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Others;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class ServiceDtoToEntity : Profile
	{
		public ServiceDtoToEntity()
		{
			CreateMap<ServiceCreateDto, ServiceDetail>();
			CreateMap<ServiceUpdateDto, ServiceDetail>();
		}
	}

	public class ServiceEntityToDto : Profile
	{
		public ServiceEntityToDto()
		{
			CreateMap<ServiceGridView, ServiceGridDto>();
			CreateMap<ServiceGridView, ServiceDetailDto>();
			CreateMap<ServiceType, ServiceTypeDto>()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.Name, mo => mo.MapFrom(src => src.details ?? string.Empty));
		}
	}
}
