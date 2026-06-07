using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.API.HubConfig;
using DoAnWebQuanLyKhachSan.API.Models;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Helpers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Net;
using System.Text;
using DoAnWebQuanLyKhachSan.Utils.Repository.Audit;

namespace DoAnWebQuanLyKhachSan.API
{
    public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			services.AddAutoMapper(cfg => { }, typeof(HotelManagementBaseService));
			services.AddScoped<ApiDbCommandLoggingInterceptor>();
			services.AddDbContext<HotelManagementContext>((serviceProvider, options) =>
			{
				options
					.UseLazyLoadingProxies()
					.UseSqlServer(Configuration.GetConnectionString("HM"))
					.AddInterceptors(serviceProvider.GetRequiredService<ApiDbCommandLoggingInterceptor>());
			});

			services.AddSingleton<IAuthorizationPolicyProvider, CustomAuthorizationPolicyProvider>();
			services.AddSingleton<IAuthorizationHandler, CustomAuthorizationHandler>();

			// using Microsoft.AspNetCore.DataProtection;
			services.AddDataProtection()
				.PersistKeysToDbContext<HotelManagementContext>();
			services.AddSignalR();
			services.Configure<Audience>(Configuration.GetSection("Audience"));

			//services.AddIdentity<USERS, MASTER_DATAS>();
			services.AddIdentityCore<User>(options =>
			{
				options.User.RequireUniqueEmail = false;
			})
			.AddEntityFrameworkStores<HotelManagementContext>()
			.AddDefaultTokenProviders();

			services.Configure<IdentityOptions>(options =>
			{
				// Password settings
				options.Password.RequireDigit = false;
				options.Password.RequiredLength = 6;
				options.Password.RequireNonAlphanumeric = false;
				options.Password.RequireUppercase = false;
				options.Password.RequireLowercase = false;
				options.Password.RequiredUniqueChars = 3;

				// Lockout settings
				options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
				options.Lockout.MaxFailedAccessAttempts = 10;
				options.Lockout.AllowedForNewUsers = true;

				// User settings
				//options.User.RequireUniqueEmail = true;
			});
			services.Configure<SMTPConfigModel>(Configuration.GetSection("EmailConfiguration"));
			services.AddHttpContextAccessor();
			services.AddTransient(typeof(Lazy<>), typeof(Lazier<>));
			services.AddScoped<ClaimsPrincipal>(x =>
			{
				var httpContextAccessor = x.GetRequiredService<IHttpContextAccessor>();
				return httpContextAccessor.HttpContext?.User ?? new ClaimsPrincipal(new ClaimsIdentity());
			});
			services.AddScoped<IUserIdentity<int>, UserIdentity>();
			services.AddScoped<DoAnWebQuanLyKhachSan.Data.HotelManagementRepository>();
			services.AddScoped<HotelManagementBaseService>();
			services.AddScoped<AuthorizationService>();
			services.AddScoped<CustomerService>();
			services.AddScoped<RoomService>();
			services.AddScoped<InvoiceService>();
			services.AddScoped<PaymentService>();
			services.AddScoped<ReviewService>();
			services.AddScoped<MessageService>();
			services.AddScoped<ChatService>();
			services.AddScoped<OtherService>();
			services.AddScoped<DashboardService>();
			services.AddScoped<BookingRoomService>();
			services.AddScoped<EmailService>();
			services.AddScoped<RoomAvailabilitySynchronizationService>();
			services.AddScoped<ClientRoomService>();
			services.AddScoped<ClientBookingService>();
			services.AddScoped<ClientPaymentService>();
			services.AddScoped<ClientBookingHistoryService>();
			services.AddScoped<ClientReviewService>();
			services.AddSwaggerGen(c =>
			{
				c.SwaggerDoc("v1", new OpenApiInfo
				{
					Title = "DoAnWebQuanLyKhachSan API",
					Version = "v1"
				});
			});

			ConfigureJwtAuthService(services);

			services.AddMvc(x => x.EnableEndpointRouting = false).SetCompatibilityVersion(CompatibilityVersion.Version_3_0).AddNewtonsoftJson();

			services.ConfigureApplicationCookie(options =>
			{
				options.Events.OnRedirectToLogin = context =>
				{
					if (context.Request.Path.StartsWithSegments("/api") && context.Response.StatusCode == (int)HttpStatusCode.OK)
					{
						context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
					}
					else
					{
						context.Response.Redirect(context.RedirectUri);
					}
					return Task.FromResult(0);
				};
			});

			//services.AddCors();
			services.AddCors(options =>
			{
				options.AddPolicy("CorsPolicy", builder => builder
					.WithOrigins(
						"https://localhost:7051",
						"http://localhost:5193",
						"https://localhost:7158",
						"http://localhost:5185")
					.AllowAnyMethod()
					.AllowAnyHeader()
					.AllowCredentials());
			});
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
		{
			if (env.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
			}

			app.UseSwagger();
			app.UseSwaggerUI(c =>
			{
				c.SwaggerEndpoint("/swagger/v1/swagger.json", "DoAnWebQuanLyKhachSan API v1");
				c.RoutePrefix = "swagger";
			});
			app.UseCors("CorsPolicy");
			app.UseRouting();
			app.UseAuthentication();
			app.UseAuthorization();
			app.UseEndpoints(endpoints =>
			{
				endpoints.MapHub<MessageHub>("/chat");
			});
			app.UseMiddleware(typeof(ErrorHandlingMiddleware));
			app.UseDefaultFiles();
			app.UseStaticFiles();
			app.UseMvc();

			InitializeRoomAvailability(app.ApplicationServices);
			//DbInitializer.Initialize(app.ApplicationServices);
		}

		private static void InitializeRoomAvailability(IServiceProvider services)
		{
			using var scope = services.CreateScope();
			var roomAvailabilitySynchronizationService = scope.ServiceProvider.GetRequiredService<RoomAvailabilitySynchronizationService>();
			roomAvailabilitySynchronizationService.SyncRoomStatusesAsync().GetAwaiter().GetResult();
		}

		public void ConfigureJwtAuthService(IServiceCollection services)
		{
			var audienceConfig = Configuration.GetSection("Audience");
			var symmetricKeyAsBase64 = audienceConfig["Secret"];
			var keyByteArray = Encoding.ASCII.GetBytes(symmetricKeyAsBase64);
			var signingKey = new SymmetricSecurityKey(keyByteArray);

			var tokenValidationParameters = new TokenValidationParameters
			{
				// The signing key must match!
				ValidateIssuerSigningKey = true,
				IssuerSigningKey = signingKey,

				// Validate the JWT Issuer (iss) claim
				ValidateIssuer = true,
				ValidIssuer = audienceConfig["Iss"],

				// Validate the JWT Audience (aud) claim
				ValidateAudience = true,
				ValidAudience = audienceConfig["Aud"],

				// Validate the token expiry
				ValidateLifetime = true,

				ClockSkew = TimeSpan.Zero
			};

			services.AddAuthentication(options =>
			{
				options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
				options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
				options.DefaultSignInScheme = JwtBearerDefaults.AuthenticationScheme;
			})
			.AddJwtBearer(o =>
			{
				//o.Authority = "";
				//o.Audience = "";
				o.TokenValidationParameters = tokenValidationParameters;
				o.Events = new JwtBearerEvents
				{
					OnMessageReceived = context =>
					{
						var accessToken = context.Request.Query["access_token"];
						var path = context.HttpContext.Request.Path;

						if (!string.IsNullOrWhiteSpace(accessToken) && path.StartsWithSegments("/chat"))
						{
							context.Token = accessToken;
						}

						return Task.CompletedTask;
					}
				};
			});


		}
	}


	public class Lazier<T> : Lazy<T> where T : class
	{
		public Lazier(IServiceProvider provider)
			: base(() => provider.GetRequiredService<T>())
		{
		}
	}
}
