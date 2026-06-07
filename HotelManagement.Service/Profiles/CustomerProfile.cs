using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Customers;
using System.Globalization;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class CustomerDtoToEntity : Profile
	{
		public CustomerDtoToEntity()
		{
			CreateMap<CustomerCreateDto, Customer>()
				.ForMember(dest => dest.id, mo => mo.MapFrom(src => src.Id))
				.ForMember(dest => dest.fullname, mo => mo.MapFrom(src => src.FullName))
				.ForMember(dest => dest.identify, mo => mo.MapFrom(src => src.Identify))
				.ForMember(dest => dest.phone, mo => mo.MapFrom(src => src.Phone))
				.ForMember(dest => dest.mail, mo => mo.MapFrom(src => src.Mail))
				.ForMember(dest => dest.dob, mo => mo.MapFrom(src => src.Dob ?? default))
				.ForMember(dest => dest.customer_type, mo => mo.MapFrom(src => src.Customer_Type));

			CreateMap<CustomerUpdateDto, Customer>()
				.ForMember(dest => dest.fullname, mo => mo.MapFrom(src => src.FullName))
				.ForMember(dest => dest.identify, mo => mo.MapFrom(src => src.Identify))
				.ForMember(dest => dest.phone, mo => mo.MapFrom(src => src.Phone))
				.ForMember(dest => dest.mail, mo => mo.MapFrom(src => src.Mail))
				.ForMember(dest => dest.dob, mo => mo.MapFrom(src => src.Dob ?? default))
				.ForMember(dest => dest.customer_type, mo => mo.MapFrom(src => src.Customer_Type));
		}
	}

	public class CustomerEntityToDto : Profile
	{
		public CustomerEntityToDto()
		{
			CreateMap<Customer, CustomerCreateDto>()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.FullName, mo => mo.MapFrom(src => src.fullname))
				.ForMember(dest => dest.Identify, mo => mo.MapFrom(src => src.identify))
				.ForMember(dest => dest.Phone, mo => mo.MapFrom(src => src.phone))
				.ForMember(dest => dest.Mail, mo => mo.MapFrom(src => src.mail))
				.ForMember(dest => dest.Dob, mo => mo.MapFrom(src => src.dob))
				.ForMember(dest => dest.Customer_Type, mo => mo.MapFrom(src => src.customer_type));

			CreateMap<Customer, CustomerGridDto>()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.FullName, mo => mo.MapFrom(src => src.fullname))
				.ForMember(dest => dest.Identify, mo => mo.MapFrom(src => src.identify ?? string.Empty))
				.ForMember(dest => dest.Phone, mo => mo.MapFrom(src => src.phone ?? string.Empty))
				.ForMember(dest => dest.Mail, mo => mo.MapFrom(src => src.mail ?? string.Empty))
				.ForMember(dest => dest.DobStr, mo => mo.MapFrom(src => src.dob.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)))
				.ForMember(dest => dest.CustomerTypeId, mo => mo.MapFrom(src => src.customer_type))
				.ForMember(dest => dest.CustomerTypeName, mo => mo.Ignore());

			CreateMap<Customer, CustomerDetailDto>()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.FullName, mo => mo.MapFrom(src => src.fullname))
				.ForMember(dest => dest.Identify, mo => mo.MapFrom(src => src.identify ?? string.Empty))
				.ForMember(dest => dest.Phone, mo => mo.MapFrom(src => src.phone ?? string.Empty))
				.ForMember(dest => dest.Mail, mo => mo.MapFrom(src => src.mail ?? string.Empty))
				.ForMember(dest => dest.DobStr, mo => mo.MapFrom(src => src.dob.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)))
				.ForMember(dest => dest.CustomerTypeId, mo => mo.MapFrom(src => src.customer_type))
				.ForMember(dest => dest.CustomerTypeName, mo => mo.Ignore());

			CreateMap<CustomerLookupView, CustomerGridDto>()
				.ForMember(dest => dest.DobStr, mo => mo.MapFrom(src => src.Dob.HasValue
					? src.Dob.Value.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)
					: null));

			CreateMap<CustomerLookupView, CustomerDetailDto>()
				.ForMember(dest => dest.DobStr, mo => mo.MapFrom(src => src.Dob.HasValue
					? src.Dob.Value.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)
					: null));

			CreateMap<CustomerType, CustomerTypeDto>()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.id))
				.ForMember(dest => dest.Name, mo => mo.MapFrom(src => src.details ?? src.summary ?? string.Empty));
		}
	}
}
