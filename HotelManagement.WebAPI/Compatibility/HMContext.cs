using DoAnWebQuanLyKhachSan.Data.Entities;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Data
{
	public class HotelManagementContext : IdentityDbContext<User, IdentityRole<int>, int>, IDataProtectionKeyContext
	{
		public HotelManagementContext(DbContextOptions<HotelManagementContext> options) : base(options)
		{
		}

		public DbSet<DataProtectionKey> DataProtectionKeys { get; set; } = null!;
		public DbSet<message> message { get; set; } = null!;
	}

	public static class DbInitializer
	{
		public static void Initialize(IServiceProvider services)
		{
		}
	}
}
