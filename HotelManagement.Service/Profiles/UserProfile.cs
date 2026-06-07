using AutoMapper;
using DoAnWebQuanLyKhachSan.Data.Entities;

namespace DoAnWebQuanLyKhachSan.Service.Profiles
{
	public class UserDtoToEntity : Profile
	{
		public UserDtoToEntity()
		{
			CreateMap<UserCreateDto, User>();
			CreateMap<UserUpdateDto, User>();
			CreateMap<ImageUpdateDto, User>();
		}
	}
}
