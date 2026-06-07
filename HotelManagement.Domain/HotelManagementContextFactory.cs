using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace DoAnWebQuanLyKhachSan.Data
{
    public class HotelManagementContextFactory : IDesignTimeDbContextFactory<HotelManagementContext>
    {
        public HotelManagementContext CreateDbContext(string[] args)
        {
            var basePath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "DoAnWebQuanLyKhachSan.API"));

            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .Build();

            var connectionString = configuration.GetConnectionString("HM");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("Connection string 'HM' was not found in DoAnWebQuanLyKhachSan.API/appsettings.json.");
            }

            var optionsBuilder = new DbContextOptionsBuilder<HotelManagementContext>();
            optionsBuilder.UseLazyLoadingProxies().UseSqlServer(connectionString);

            return new HotelManagementContext(optionsBuilder.Options);
        }
    }
}
