using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Utils.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Data;
using System.Text.Json;

namespace DoAnWebQuanLyKhachSan.Data
{
	public class DbInitializer
	{
		public static void Initialize(IServiceProvider serviceProvider)
		{
			using (var serviceScope = serviceProvider.CreateScope())
			{
				var context = serviceScope.ServiceProvider.GetService<HotelManagementContext>();

				context.Database.Migrate();
				//context.Database.ExecuteSqlRaw(@"
				//						UPDATE Users
				//						SET FullName = ISNULL(NULLIF(FullName, ''), UserName)
				//						WHERE FullName IS NULL OR FullName = '';

				//						UPDATE Users
				//						SET backgroundImage = 'avartar/user.png'
				//						WHERE backgroundImage IS NULL OR backgroundImage = '';

				//						UPDATE Users
				//						SET IsAdministrator = ISNULL(IsAdministrator, 0),
				//							EmailConfirmed = ISNULL(EmailConfirmed, 0),
				//							PhoneNumberConfirmed = ISNULL(PhoneNumberConfirmed, 0),
				//							TwoFactorEnabled = ISNULL(TwoFactorEnabled, 0),
				//							LockoutEnabled = ISNULL(LockoutEnabled, 0),
				//							AccessFailedCount = ISNULL(AccessFailedCount, 0)
				//						WHERE IsAdministrator IS NULL
				//						   OR EmailConfirmed IS NULL
				//						   OR PhoneNumberConfirmed IS NULL
				//						   OR TwoFactorEnabled IS NULL
				//						   OR LockoutEnabled IS NULL
				//						   OR AccessFailedCount IS NULL;

				//						UPDATE IdentityClients
				//						SET Description = ISNULL(NULLIF(Description, ''), IdentityClientId),
				//							SecretKey = ISNULL(SecretKey, ''),
				//							AllowedOrigin = ISNULL(AllowedOrigin, '*'),
				//							ClientType = ISNULL(ClientType, 0),
				//							IsActive = ISNULL(IsActive, 1),
				//							RefreshTokenLifetime = ISNULL(RefreshTokenLifetime, 30)
				//						WHERE Description IS NULL
				//						   OR SecretKey IS NULL
				//						   OR AllowedOrigin IS NULL
				//						   OR ClientType IS NULL
				//						   OR IsActive IS NULL
				//						   OR RefreshTokenLifetime IS NULL;
				//						");

				//SeedAuthorizationData(context);

				//if (!context.IdentityClients.Any())
				//{
				//	context.IdentityClients.Add(new DoAnWebQuanLyKhachSan.Data.Entities.IdentityClient()
				//	{
				//		IdentityClientId = "HM",
				//		Description = "HM",
				//		SecretKey = "b0udcdl8k80cqiyt63uq",
				//		ClientType = 0,
				//		IsActive = true,
				//		RefreshTokenLifetime = 30,
				//		AllowedOrigin = "*"
				//	});

				//	context.SaveChanges();

				//	var passwordHasher = new PasswordHasher<User>();
				//	var adminUser = new User
				//	{
				//		FullName = "Administrator",
				//		IsAdministrator = true,
				//		Email = "admin@gmail.com",
				//		NormalizedEmail = "admin@gmail.com",
				//		UserName = "admin",
				//		NormalizedUserName = "admin",
				//		EmailConfirmed = true,
				//		SecurityStamp = Guid.NewGuid().ToString("D"),
				//		backgroundImage = "avartar/user.png"
				//	};

				//	adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "123456");

				//	context.Users.Add(adminUser);

				//	context.SaveChanges();
				//}

				SeedOperationalData(context);
			}
		}

		private static void SeedAuthorizationData(HotelManagementContext context)
		{
			var privilegeDefinitions = Enum.GetValues(typeof(PrivilegeList))
				.OfType<PrivilegeList>()
				.Select(x => new Privilege
				{
					Id = x.ToString(),
					Name = x.GetEnumDescription(),
					Description = x.GetEnumDescription(),
					Status = true
				})
				.ToList();

			var roleDefinitions = new List<(string Name, string Description, string[] Privileges)>
			{
				("Administrator", "Toàn quyền hệ thống",
					Enum.GetValues(typeof(PrivilegeList)).OfType<PrivilegeList>().Select(x => x.ToString()).ToArray()),
				("Hotel Manager", "Quản lý khách sạn", new[]
				{
					nameof(PrivilegeList.ViewEmployee), nameof(PrivilegeList.ManageEmployee), nameof(PrivilegeList.ViewRoom), nameof(PrivilegeList.ManageRoom),
					nameof(PrivilegeList.ViewBooking), nameof(PrivilegeList.ManageBooking), nameof(PrivilegeList.ViewInvoice),
					nameof(PrivilegeList.ViewService), nameof(PrivilegeList.ManageService), nameof(PrivilegeList.ViewDashboard), nameof(PrivilegeList.ViewReport)
				}),
				("Receptionist", "Lễ tân", new[]
				{
					nameof(PrivilegeList.ViewCustomer), nameof(PrivilegeList.ManageCustomer), nameof(PrivilegeList.ViewRoom), nameof(PrivilegeList.ViewBooking),
					nameof(PrivilegeList.ManageBooking), nameof(PrivilegeList.CheckIn), nameof(PrivilegeList.CheckOut),
					nameof(PrivilegeList.ViewInvoice), nameof(PrivilegeList.CreateInvoice), nameof(PrivilegeList.ViewPayment)
				}),
				("Accountant", "Kế toán", new[]
				{
					nameof(PrivilegeList.ViewInvoice), nameof(PrivilegeList.ManageInvoice), nameof(PrivilegeList.ViewPayment),
					nameof(PrivilegeList.ManagePayment), nameof(PrivilegeList.ViewRevenueReport), nameof(PrivilegeList.ExportFinancialReport)
				}),
				("Service Staff", "Nhân viên dịch vụ", new[]
				{
					nameof(PrivilegeList.ViewService), nameof(PrivilegeList.ManageService), nameof(PrivilegeList.UpdateServiceUsage),
					nameof(PrivilegeList.ViewCustomerSupport)
				}),
				("Customer", "Khách hàng", new[]
				{
					nameof(PrivilegeList.RegisterAccount), nameof(PrivilegeList.LoginAccount), nameof(PrivilegeList.ViewRoom),
					nameof(PrivilegeList.ViewRoomPrice), nameof(PrivilegeList.CreateBooking), nameof(PrivilegeList.OnlinePayment),
					nameof(PrivilegeList.ViewBookingHistory), nameof(PrivilegeList.SubmitFeedback)
				})
			};

			using var transaction = context.Database.BeginTransaction(IsolationLevel.ReadCommitted);

			context.RolePrivileges.RemoveRange(context.RolePrivileges);
			context.UserRoles.RemoveRange(context.UserRoles);
			context.UserPrivileges.RemoveRange(context.UserPrivileges);
			context.Privileges.RemoveRange(context.Privileges);
			context.Roles.RemoveRange(context.Roles);
			context.SaveChanges();

			var roles = roleDefinitions.Select(x => new Role
			{
				Name = x.Name,
				Description = x.Description
			}).ToList();

			context.Privileges.AddRange(privilegeDefinitions);
			context.Roles.AddRange(roles);
			context.SaveChanges();

			var roleMap = context.Roles.ToDictionary(x => x.Name, x => x.Id);
			var rolePrivileges = roleDefinitions
				.SelectMany(x => x.Privileges.Select(p => new RolePrivilege
				{
					RoleId = roleMap[x.Name],
					PrivilegeId = p
				}))
				.ToList();

			context.RolePrivileges.AddRange(rolePrivileges);

			var adminRoleId = roleMap["Administrator"];
			var adminUsers = context.Users
				.Where(x => x.UserName == "admin" || x.IsAdministrator)
				.Select(x => x.Id)
				.ToList();

			foreach (var userId in adminUsers.Distinct())
			{
				context.UserRoles.Add(new UserRole
				{
					UserId = userId,
					RoleId = adminRoleId
				});
			}

			context.SaveChanges();
			transaction.Commit();
		}

		private static void SeedOperationalData(HotelManagementContext context)
		{
			var employeeId = EnsureSeedEmployee(context);
			var customerTypeId = EnsureCustomerType(context);
			SeedRoomTypes(context);
			SeedRoomStatuses(context);

			var beverageTypeId = EnsureServiceType(context, "Đồ uống");
			var laundryTypeId = EnsureServiceType(context, "Giặt ủi");
			var snackTypeId = EnsureServiceType(context, "Đồ ăn nhẹ");

			var drinkingWaterId = EnsureServiceDetail(context, "Nước suối", "NUOC_SUOI", 12000m, "Chai", beverageTypeId, 200);
			var instantNoodleId = EnsureServiceDetail(context, "Mì ly", "MI_LY", 25000m, "Ly", snackTypeId, 120);
			var laundryId = EnsureServiceDetail(context, "Giặt áo quần", "GIAT_UI", 50000m, "Lần", laundryTypeId, 80);

			var bookingVoucherId = EnsureVoucher(
				context,
				"BOOKING10",
				10m,
				new DateTime(2026, 1, 1),
				new DateTime(2026, 12, 31));

			var serviceVoucherId = EnsureVoucher(
				context,
				"SERVICE5",
				5m,
				new DateTime(2026, 1, 1),
				new DateTime(2026, 12, 31));

			var additionalVoucherIds = SeedAdditionalVouchers(context);

			var customerAId = EnsureCustomer(
				context,
				"Nguyen Van A",
				"079201000001",
				"0909000001",
				"nguyenvana@example.com",
				new DateTime(1994, 3, 12),
				customerTypeId);

			var customerBId = EnsureCustomer(
				context,
				"Tran Thi B",
				"079201000002",
				"0909000002",
				"tranthib@example.com",
				new DateTime(1997, 7, 23),
				customerTypeId);

			var additionalCustomerIds = SeedAdditionalCustomers(context, customerTypeId);

			var room101Id = EnsureRoom(context, "P101", 450000m, "STANDARD", "AVAILABLE");
			var room201Id = EnsureRoom(context, "P201", 750000m, "DELUXE", "AVAILABLE");

			var additionalRoomIds = SeedAdditionalRooms(context);
			var additionalServiceIds = SeedAdditionalServiceDetails(context, beverageTypeId, laundryTypeId, snackTypeId);

			var bookingOneId = EnsureBooking(
				context,
				customerAId,
				room101Id,
				new DateTime(2026, 5, 8),
				new DateTime(2026, 5, 10),
				150000m,
				employeeId,
				bookingVoucherId);

			var bookingTwoId = EnsureBooking(
				context,
				customerBId,
				room201Id,
				new DateTime(2026, 5, 11),
				new DateTime(2026, 5, 14),
				250000m,
				employeeId,
				null);

			EnsureInvoice(
				context,
				bookingOneId,
				employeeId,
				CreatePaymentMetadata("Cash", note: "Thanh toán tại quầy"),
				new DateTime(2026, 5, 10, 9, 0, 0),
				new[]
				{
					new SeedInvoiceDetail(drinkingWaterId, 4, new DateTime(2026, 5, 9, 20, 0, 0), null),
					new SeedInvoiceDetail(laundryId, 1, new DateTime(2026, 5, 10, 8, 0, 0), serviceVoucherId)
				});

			EnsureInvoice(
				context,
				bookingTwoId,
				employeeId,
				CreatePaymentMetadata(
					"BankTransfer",
					accountName: "Khach san HM",
					accountNumber: "123456789",
					bankName: "VCB",
					qrContent: "BANK:VCB|ACCOUNT:123456789|NAME:Khach san HM",
					note: "Khách chuyển khoản"),
				new DateTime(2026, 5, 14, 10, 30, 0),
				new[]
				{
					new SeedInvoiceDetail(drinkingWaterId, 2, new DateTime(2026, 5, 12, 21, 0, 0), null),
					new SeedInvoiceDetail(instantNoodleId, 2, new DateTime(2026, 5, 13, 22, 0, 0), serviceVoucherId)
				});

			var invoiceServiceIds = new List<int>
			{
				drinkingWaterId,
				instantNoodleId,
				laundryId
			};
			invoiceServiceIds.AddRange(additionalServiceIds);

			for (var i = 0; i < 10; i++)
			{
				var dateStart = new DateTime(2026, 6, 1).AddDays(i * 2);
				var dateEnd = dateStart.AddDays((i % 3) + 1);
				var deposit = 100000m + (i * 50000m);
				var voucherId = i % 2 == 0 ? additionalVoucherIds?[i] : null;

				var bookingId = EnsureBooking(
					context,
					additionalCustomerIds[i],
					additionalRoomIds[i],
					dateStart,
					dateEnd,
					deposit,
					employeeId,
					voucherId);

				var paymentMethod = i % 2 == 0 ? "Cash" : "BankTransfer";
				var paymentMetadata = paymentMethod == "Cash"
					? CreatePaymentMetadata("Cash", note: $"Thanh toán seed #{i + 1}")
					: CreatePaymentMetadata(
						"BankTransfer",
						accountName: "Khach san HM",
						accountNumber: $"12345678{i + 10}",
						bankName: "VCB",
						qrContent: $"BANK:VCB|ACCOUNT:12345678{i + 10}|NAME:Khach san HM",
						note: $"Chuyển khoản seed #{i + 1}");

				var primaryServiceId = invoiceServiceIds[(i * 2) % invoiceServiceIds.Count];
				var secondaryServiceId = invoiceServiceIds[((i * 2) + 1) % invoiceServiceIds.Count];

				EnsureInvoice(
					context,
					bookingId,
					employeeId,
					paymentMetadata,
					dateEnd.AddHours(9),
					new[]
					{
						new SeedInvoiceDetail(primaryServiceId, (i % 4) + 1, dateStart.AddHours(18), i % 2 == 0 ? serviceVoucherId : null),
						new SeedInvoiceDetail(secondaryServiceId, (i % 3) + 1, dateEnd.AddHours(-3), i % 3 == 0 ? additionalVoucherIds[(i + 1) % additionalVoucherIds.Count] : null)
					});
			}
		}

		private static List<int> SeedAdditionalVouchers(HotelManagementContext context)
		{
			var voucherIds = new List<int>();

			for (var i = 1; i <= 10; i++)
			{
				voucherIds.Add(EnsureVoucher(
					context,
					$"SEED{i:00}",
					5m + i,
					new DateTime(2026, 1, 1).AddDays(i - 1),
					new DateTime(2026, 12, 31).AddDays(-(i - 1))));
			}

			return voucherIds;
		}

		private static List<int> SeedAdditionalCustomers(HotelManagementContext context, int customerTypeId)
		{
			var customerIds = new List<int>();

			for (var i = 1; i <= 10; i++)
			{
				customerIds.Add(EnsureCustomer(
					context,
					$"Khach Seed {i:00}",
					$"0792011000{i:00}",
					$"0911000{i:000}",
					$"khachseed{i:00}@example.com",
					new DateTime(1990, 1, 1).AddDays(i * 37),
					customerTypeId));
			}

			return customerIds;
		}

		private static List<int> SeedAdditionalRooms(HotelManagementContext context)
		{
			var roomTypeIds = new[] { "STANDARD", "DELUXE", "VIP" };
			var roomIds = new List<int>();

			for (var i = 1; i <= 10; i++)
			{
				var roomTypeId = roomTypeIds[(i - 1) % roomTypeIds.Length];
				var price = roomTypeId switch
				{
					"STANDARD" => 400000m + (i * 10000m),
					"DELUXE" => 650000m + (i * 15000m),
					_ => 950000m + (i * 20000m)
				};

				roomIds.Add(EnsureRoom(
					context,
					$"P{i + 300}",
					price,
					roomTypeId,
					"AVAILABLE"));
			}

			return roomIds;
		}

		private static List<int> SeedAdditionalServiceDetails(
			HotelManagementContext context,
			int beverageTypeId,
			int laundryTypeId,
			int snackTypeId)
		{
			var serviceDefinitions = new[]
			{
				new { Name = "Coca Cola lon", Code = "COCA_LON", Price = 18000m, Unit = "Lon", TypeId = beverageTypeId, Inventory = 160 },
				new { Name = "Pepsi lon", Code = "PEPSI_LON", Price = 18000m, Unit = "Lon", TypeId = beverageTypeId, Inventory = 150 },
				new { Name = "7Up lon", Code = "7UP_LON", Price = 18000m, Unit = "Lon", TypeId = beverageTypeId, Inventory = 140 },
				new { Name = "Sting dâu", Code = "STING_DAU", Price = 20000m, Unit = "Chai", TypeId = beverageTypeId, Inventory = 120 },
				new { Name = "Bánh quy bơ", Code = "BANH_QUY_BO", Price = 30000m, Unit = "Hộp", TypeId = snackTypeId, Inventory = 90 },
				new { Name = "Khoai tây chip", Code = "KHOAI_TAY_CHIP", Price = 25000m, Unit = "Gói", TypeId = snackTypeId, Inventory = 110 },
				new { Name = "Đậu phộng da cá", Code = "DAU_PHONG", Price = 22000m, Unit = "Gói", TypeId = snackTypeId, Inventory = 95 },
				new { Name = "Giặt chăn ga", Code = "GIAT_CHAN_GA", Price = 80000m, Unit = "Lần", TypeId = laundryTypeId, Inventory = 50 },
				new { Name = "Giặt vest", Code = "GIAT_VEST", Price = 120000m, Unit = "Lần", TypeId = laundryTypeId, Inventory = 40 },
				new { Name = "Ủi đồ", Code = "UI_DO", Price = 40000m, Unit = "Lần", TypeId = laundryTypeId, Inventory = 70 }
			};

			return serviceDefinitions
				.Select(x => EnsureServiceDetail(context, x.Name, x.Code, x.Price, x.Unit, x.TypeId, x.Inventory))
				.ToList();
		}

		private static int EnsureSeedEmployee(HotelManagementContext context)
		{
			var adminUser = context.Users.FirstOrDefault(x => x.UserName == "admin");
			if (adminUser != null)
			{
				return adminUser.Id;
			}

			var passwordHasher = new PasswordHasher<User>();
			var employee = new User
			{
				FullName = "Seed Administrator",
				IsAdministrator = true,
				Email = "seed-admin@gmail.com",
				NormalizedEmail = "SEED-ADMIN@GMAIL.COM",
				UserName = "seedadmin",
				NormalizedUserName = "SEEDADMIN",
				EmailConfirmed = true,
				SecurityStamp = Guid.NewGuid().ToString("D"),
				backgroundImage = "avartar/user.png"
			};

			employee.PasswordHash = passwordHasher.HashPassword(employee, "123456");

			context.Users.Add(employee);
			context.SaveChanges();
			return employee.Id;
		}

		private static int EnsureCustomerType(HotelManagementContext context)
		{
			var customerType = context.CustomerTypes.FirstOrDefault(x => x.summary == "Khách hàng thường")
				?? context.CustomerTypes.FirstOrDefault(x => x.details == "Khách hàng thường")
				?? context.CustomerTypes.OrderBy(x => x.id).FirstOrDefault();

			if (customerType != null)
			{
				return customerType.id;
			}

			customerType = new CustomerType
			{
				details = "Khách hàng thường",
				summary = "Khách hàng thường"
			};

			context.CustomerTypes.Add(customerType);
			context.SaveChanges();
			return customerType.id;
		}

		private static void SeedRoomTypes(HotelManagementContext context)
		{
			EnsureRoomType(context, "STANDARD", "Phòng tiêu chuẩn");
			EnsureRoomType(context, "DELUXE", "Phòng deluxe");
			EnsureRoomType(context, "VIP", "Phòng VIP");
		}

		private static void SeedRoomStatuses(HotelManagementContext context)
		{
			EnsureRoomStatus(context, "AVAILABLE", "Sẵn sàng");
			EnsureRoomStatus(context, "OCCUPIED", "Đang sử dụng");
			EnsureRoomStatus(context, "MAINTENANCE", "Bảo trì");
		}

		private static void EnsureRoomType(HotelManagementContext context, string id, string details)
		{
			var roomType = context.RoomTypes.FirstOrDefault(x => x.id == id);
			if (roomType == null)
			{
				context.RoomTypes.Add(new RoomType
				{
					id = id,
					details = details
				});
			}
			else if (string.IsNullOrWhiteSpace(roomType.details))
			{
				roomType.details = details;
			}

			context.SaveChanges();
		}

		private static void EnsureRoomStatus(HotelManagementContext context, string id, string details)
		{
			var roomStatus = context.RoomStatuses.FirstOrDefault(x => x.id == id);
			if (roomStatus == null)
			{
				context.RoomStatuses.Add(new RoomStatus
				{
					id = id,
					details = details
				});
			}
			else if (string.IsNullOrWhiteSpace(roomStatus.details))
			{
				roomStatus.details = details;
			}

			context.SaveChanges();
		}

		private static int EnsureServiceType(HotelManagementContext context, string details)
		{
			var serviceType = context.ServiceTypes.FirstOrDefault(x => x.details == details);
			if (serviceType != null)
			{
				return serviceType.id;
			}

			serviceType = new ServiceType
			{
				details = details
			};

			context.ServiceTypes.Add(serviceType);
			context.SaveChanges();
			return serviceType.id;
		}

		private static int EnsureServiceDetail(
			HotelManagementContext context,
			string name,
			string serviceCode,
			decimal price,
			string unitName,
			int serviceTypeId,
			int inventory)
		{
			var serviceDetail = context.ServiceDetails.FirstOrDefault(x => x.service_code == serviceCode);
			if (serviceDetail != null)
			{
				serviceDetail.name_service = name;
				serviceDetail.price = price;
				serviceDetail.unit_name = unitName;
				serviceDetail.servicetype_id = serviceTypeId;
				serviceDetail.remaining_inventory = serviceDetail.remaining_inventory ?? inventory;
				context.SaveChanges();
				return serviceDetail.id;
			}

			serviceDetail = new ServiceDetail
			{
				name_service = name,
				service_code = serviceCode,
				price = price,
				unit_name = unitName,
				servicetype_id = serviceTypeId,
				remaining_inventory = inventory
			};

			context.ServiceDetails.Add(serviceDetail);
			context.SaveChanges();
			return serviceDetail.id;
		}

		private static int EnsureVoucher(HotelManagementContext context, string code, decimal percent, DateTime startDate, DateTime endDate)
		{
			var voucher = context.Vouchers.FirstOrDefault(x => x.voucher_code == code);
			if (voucher != null)
			{
				voucher.voucher_percent = percent;
				voucher.date_start = startDate;
				voucher.date_end = endDate;
				context.SaveChanges();
				return voucher.id;
			}

			voucher = new Voucher
			{
				voucher_code = code,
				voucher_percent = percent,
				date_start = startDate,
				date_end = endDate
			};

			context.Vouchers.Add(voucher);
			context.SaveChanges();
			return voucher.id;
		}

		private static int EnsureCustomer(
			HotelManagementContext context,
			string fullName,
			string identify,
			string phone,
			string email,
			DateTime dob,
			int customerTypeId)
		{
			var customer = context.Customers.FirstOrDefault(x => x.identify == identify);
			if (customer != null)
			{
				customer.fullname = fullName;
				customer.phone = phone;
				customer.mail = email;
				customer.dob = dob;
				customer.customer_type = customerTypeId;
				context.SaveChanges();
				return customer.id;
			}

			customer = new Customer
			{
				fullname = fullName,
				identify = identify,
				phone = phone,
				mail = email,
				dob = dob,
				customer_type = customerTypeId
			};

			context.Customers.Add(customer);
			context.SaveChanges();
			return customer.id;
		}

		private static int EnsureRoom(HotelManagementContext context, string roomName, decimal price, string roomTypeId, string roomStatusId)
		{
			var room = context.Rooms.FirstOrDefault(x => x.room_name == roomName);
			if (room != null)
			{
				room.price = price;
				room.roomtype_id = roomTypeId;
				room.room_status = roomStatusId;
				context.SaveChanges();
				return room.id;
			}

			room = new Room
			{
				room_name = roomName,
				price = price,
				roomtype_id = roomTypeId,
				room_status = roomStatusId
			};

			context.Rooms.Add(room);
			context.SaveChanges();
			return room.id;
		}

		private static int EnsureBooking(
			HotelManagementContext context,
			int customerId,
			int roomId,
			DateTime dateStart,
			DateTime dateEnd,
			decimal deposit,
			int employeeId,
			int? voucherId)
		{
			var userId = context.Customers
				.Where(x => x.id == customerId)
				.Select(x => x.userid)
				.FirstOrDefault();

			var booking = context.Bookings.FirstOrDefault(x =>
				x.user_id == userId &&
				x.room_id == roomId &&
				x.date_start == dateStart &&
				x.date_end == dateEnd);

			if (booking != null)
			{
				booking.date_booking = booking.date_booking ?? dateStart.AddDays(-2);
				booking.deposit = deposit;
				booking.employee_id = employeeId;
				booking.voucher_id = voucherId;
				context.SaveChanges();
				return booking.id;
			}

			booking = new Booking
			{
				user_id = userId,
				room_id = roomId,
				date_booking = dateStart.AddDays(-2),
				date_start = dateStart,
				date_end = dateEnd,
				deposit = deposit,
				employee_id = employeeId,
				voucher_id = voucherId
			};

			context.Bookings.Add(booking);
			context.SaveChanges();
			return booking.id;
		}

		private static void EnsureInvoice(
			HotelManagementContext context,
			int bookingId,
			int employeeId,
			string paymentDetails,
			DateTime issueDate,
			IEnumerable<SeedInvoiceDetail> details)
		{
			var invoice = context.Invoices.FirstOrDefault(x => x.booking_id == bookingId);
			if (invoice == null)
			{
				var payment = new Payment
				{
					method = "Cash",
					name_account = paymentDetails
				};

				context.Payments.Add(payment);
				context.SaveChanges();

				invoice = new Invoice
				{
					booking_id = bookingId,
					employee_id = employeeId,
					issue_date = issueDate,
					payment_id = payment.id
				};

				context.Invoices.Add(invoice);
				context.SaveChanges();
			}
			else
			{
				invoice.employee_id = employeeId;
				invoice.issue_date = issueDate;

				if (!invoice.payment_id.HasValue)
				{
					var payment = new Payment
					{
						method = "Cash",
						name_account = paymentDetails
					};

					context.Payments.Add(payment);
					context.SaveChanges();
					invoice.payment_id = payment.id;
				}
				else
				{
					var payment = context.Payments.FirstOrDefault(x => x.id == invoice.payment_id.Value);
					if (payment != null)
					{
						payment.method = "Cash";
						payment.name_account = paymentDetails;
						payment.account_number = null;
						payment.bank_name = null;
					}
				}

				context.SaveChanges();
			}

			foreach (var detail in details)
			{
				var invoiceDetail = context.InvoiceDetails.FirstOrDefault(x =>
					x.invoice_id == invoice.id &&
					x.servicedetail_id == detail.ServiceDetailId &&
					x.use_date == detail.UseDate);

				if (invoiceDetail == null)
				{
					context.InvoiceDetails.Add(new InvoiceDetail
					{
						invoice_id = invoice.id,
						servicedetail_id = detail.ServiceDetailId,
						quantity = detail.Quantity,
						use_date = detail.UseDate,
						voucher_id = detail.VoucherId
					});
				}
				else
				{
					invoiceDetail.quantity = detail.Quantity;
					invoiceDetail.voucher_id = detail.VoucherId;
				}
			}

			context.SaveChanges();
		}

		private static string CreatePaymentMetadata(
			string method,
			string? accountName = null,
			string? accountNumber = null,
			string? bankName = null,
			string? qrContent = null,
			string? note = null)
		{
			return JsonSerializer.Serialize(new
			{
				Method = method,
				AccountName = accountName,
				AccountNumber = accountNumber,
				BankName = bankName,
				QrContent = qrContent,
				Note = note
			});
		}

		private sealed record SeedInvoiceDetail(int ServiceDetailId, int Quantity, DateTime UseDate, int? VoucherId);
	}
}
