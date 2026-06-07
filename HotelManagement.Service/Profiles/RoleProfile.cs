using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Helpers;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class RoleDtoToEntity : Profile
	{
		public RoleDtoToEntity()
		{
			CreateMap<RoleCreateDto, Role>();
			CreateMap<RoleUpdateDto, Role>();
		}
	}

	public class RoleEntityToDto : Profile
	{
		public RoleEntityToDto()
		{
			CreateMap<Role, RoleCreateDto>().IgnoreAllNonExisting()
				 .ForMember(dest => dest.Id, mo => mo.MapFrom(src => src.Id)); // Get newly created identity Id back to Dto
			CreateMap<Role, RoleGridDto>();
			CreateMap<Role, RoleDetailDto>();
			CreateMap<RolePrivilege, RolePrivilegeDto>();
		}
	}
}
