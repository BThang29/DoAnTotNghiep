using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Common;
using DoAnWebQuanLyKhachSan.Service.Helpers;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class EmployeeDtoToEntity : Profile
	{
		public EmployeeDtoToEntity()
		{
			CreateMap<UserCreateDto, User>();
			CreateMap<UserUpdateDto, User>();
		}
	}

	public class EmployeeEntityToDto : Profile
	{
		private const string CustomerRoleName = "Customer";
		private const string DefaultAvatar = "user.png";

		public EmployeeEntityToDto()
		{
			CreateMap<User, UserGridDto>().IgnoreAllNonExisting()
				.ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.Id))
				.ForMember(dest => dest.UserName, mo => mo.MapFrom(src => src.UserName))
				.ForMember(dest => dest.Roles, mo => mo.MapFrom(src => src.UserRoles
					.Where(x => x.Role != null && x.Role.Name != CustomerRoleName)
					.Select(x => x.Role.Name)
					.Distinct()))
				.ForMember(dest => dest.CreateDate, mo => mo.MapFrom(src => src.CreateDate.HasValue ? src.CreateDate.Value.ToString("yyyy-MM-dd HH:mm:ss") : string.Empty))
				.ForMember(dest => dest.backgroundImage, mo => mo.MapFrom(src => ImageToBase64.HandleImage(string.IsNullOrWhiteSpace(src.backgroundImage) ? DefaultAvatar : src.backgroundImage, "images")));

			CreateMap<User, UserDetailDto>()
				.ForMember(dest => dest.UserName, mo => mo.MapFrom(src => src.UserName))
				.ForMember(dest => dest.RoleIds, mo => mo.MapFrom(src => src.UserRoles
					.Where(x => x.Role != null && x.Role.Name != CustomerRoleName)
					.Select(x => x.RoleId)
					.Distinct()))
				.ForMember(dest => dest.RoleNames, mo => mo.MapFrom(src => src.UserRoles
					.Where(x => x.Role != null && x.Role.Name != CustomerRoleName)
					.Select(x => x.Role.Name)
					.Distinct()))
				.ForMember(dest => dest.CreateDate, mo => mo.MapFrom(src => src.CreateDate.HasValue ? src.CreateDate.Value.ToString("yyyy-MM-dd HH:mm:ss") : string.Empty))
				.ForMember(dest => dest.backgroundImage, mo => mo.MapFrom(src => ImageToBase64.HandleImage(string.IsNullOrWhiteSpace(src.backgroundImage) ? DefaultAvatar : src.backgroundImage, "images")));

			CreateMap<UserPrivilege, UserPrivilegeDto>();
		}
	}
}
