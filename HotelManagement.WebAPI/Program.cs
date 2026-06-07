namespace DoAnWebQuanLyKhachSan.API
{
	public class Program
	{
		private static readonly string ApiLogDirectory = System.IO.Path.Combine(AppContext.BaseDirectory, "logs");
		private const string ApiLogFilePrefix = "api";

		public static void Main(string[] args)
		{
			CreateHostBuilder(args).Build().Run();
		}

		public static IHostBuilder CreateHostBuilder(string[] args) =>
			Host.CreateDefaultBuilder(args)
				.ConfigureLogging(logging =>
				{
					logging.ClearProviders();
					logging.AddProvider(new Helpers.FileLoggerProvider(ApiLogDirectory, ApiLogFilePrefix, LogLevel.Information));
					logging.AddConsole();
					logging.AddDebug();
				})
				.ConfigureWebHostDefaults(webBuilder =>
				{
					webBuilder.UseStartup<Startup>();
				});
	}
}
