using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace DoAnWebQuanLyKhachSan.Data
{
    public class HotelManagementContextFactory : IDesignTimeDbContextFactory<HotelManagementContext>
    {
        public HotelManagementContext CreateDbContext(string[] args)
        {
            // Try to find appsettings.json in common locations
            string basePath = null;
            
            // First try HotelManagement.WebAPI
            var webApiPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "HotelManagement.WebAPI"));
            if (Directory.Exists(webApiPath) && File.Exists(Path.Combine(webApiPath, "appsettings.json")))
            {
                basePath = webApiPath;
            }
            
            // Fallback to DoAnWebQuanLyKhachSan.API
            if (basePath == null)
            {
                var apiPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "DoAnWebQuanLyKhachSan.API"));
                if (Directory.Exists(apiPath) && File.Exists(Path.Combine(apiPath, "appsettings.json")))
                {
                    basePath = apiPath;
                }
            }

            if (basePath == null)
            {
                throw new InvalidOperationException("Could not find appsettings.json in HotelManagement.WebAPI or DoAnWebQuanLyKhachSan.API folder.");
            }

            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .Build();

            var connectionString = configuration.GetConnectionString("HM");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException($"Connection string 'HM' was not found in {basePath}/appsettings.json.");
            }

            var optionsBuilder = new DbContextOptionsBuilder<HotelManagementContext>();
            optionsBuilder.UseLazyLoadingProxies().UseSqlServer(connectionString);

            return new HotelManagementContext(optionsBuilder.Options);
        }
    }
}
