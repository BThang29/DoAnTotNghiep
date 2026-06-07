using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Invoices;
using DoAnWebQuanLyKhachSan.Utils.Repository.Audit;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class InvoiceService
	{
		private readonly HotelManagementRepository _repository;
		private readonly IUserIdentity<int> _userIdentity;
		private readonly BaseService _baseService;

		public InvoiceService(HotelManagementRepository repository, IUserIdentity<int> userIdentity, IMapper mapper)
		{
			_repository = repository;
			_userIdentity = userIdentity;
			_baseService = new BaseService(repository, mapper);
		}

		public async Task<PagingResult<InvoiceGridDto>> GetInvoices(InvoiceGridPagingDto pagingModel)
		{
			pagingModel ??= new InvoiceGridPagingDto();
			return await _baseService.FilterPagedAsync<InvoiceGridView, InvoiceGridDto>(pagingModel);
		}

		public async Task<InvoiceDetailDto?> GetInvoiceById(int id)
		{
			var invoice = await GetDbContext().Invoices.AsNoTracking().FirstOrDefaultAsync(x => x.id == id);
			if (invoice == null)
			{
				return null;
			}

			return await BuildInvoiceDetailAsync(invoice);
		}

		public async Task<InvoiceCalculationDto?> CalculateInvoice(InvoiceCreateDto model)
		{
			var booking = await GetDbContext().Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.id == model.BookingId);
			if (booking == null)
			{
				return null;
			}

			return await BuildCalculationAsync(booking, model.ServiceItems ?? new List<InvoiceServiceItemDto>());
		}

		public async Task<int?> CreateInvoice(InvoiceCreateDto model)
		{
			var booking = await GetDbContext().Bookings.FirstOrDefaultAsync(x => x.id == model.BookingId);
			if (booking == null)
			{
				return null;
			}

			var serviceItems = model.ServiceItems ?? new List<InvoiceServiceItemDto>();
			var serviceIds = serviceItems.Select(x => x.ServiceDetailId).Distinct().ToArray();
			var existingServiceIds = await GetDbContext().ServiceDetails
				.AsNoTracking()
				.Where(x => serviceIds.Contains(x.id))
				.Select(x => x.id)
				.ToListAsync();

			if (existingServiceIds.Count != serviceIds.Length)
			{
				return -2;
			}

			var voucherIds = serviceItems.Where(x => x.VoucherId.HasValue).Select(x => x.VoucherId!.Value).Distinct().ToArray();
			var existingVoucherIds = await GetDbContext().Vouchers
				.AsNoTracking()
				.Where(x => voucherIds.Contains(x.id))
				.Select(x => x.id)
				.ToListAsync();

			if (existingVoucherIds.Count != voucherIds.Length)
			{
				return -3;
			}

			using var transaction = _repository.BeginTransaction();
			try
			{
				var payment = new Payment
				{
					method = "Cash",
					name_account = string.IsNullOrWhiteSpace(model.PaymentDetails) ? null : model.PaymentDetails.Trim()
				};

				GetDbContext().Payments.Add(payment);
				await GetDbContext().SaveChangesAsync();

				var invoice = new Invoice
				{
					booking_id = booking.id,
					issue_date = DateTime.Now,
					employee_id = _userIdentity.UserId,
					payment_id = payment.id
				};

				GetDbContext().Invoices.Add(invoice);
				await GetDbContext().SaveChangesAsync();

				var details = serviceItems.Select(x => new InvoiceDetail
				{
					invoice_id = invoice.id,
					servicedetail_id = x.ServiceDetailId,
					quantity = x.Quantity <= 0 ? 1 : x.Quantity,
					use_date = x.UseDate ?? DateTime.Now,
					voucher_id = x.VoucherId
				}).ToList();

				if (details.Count > 0)
				{
					GetDbContext().InvoiceDetails.AddRange(details);
					await GetDbContext().SaveChangesAsync();
				}

				await transaction.CommitAsync();
				return invoice.id;
			}
			catch
			{
				await transaction.RollbackAsync();
				throw;
			}
		}

		public async Task<InvoiceDetailDto?> GetPrintableInvoice(int id)
		{
			return await GetInvoiceById(id);
		}

		public async Task<bool?> DeleteInvoice(int id)
		{
			var invoice = await GetDbContext().Invoices.FirstOrDefaultAsync(x => x.id == id);
			if (invoice == null)
			{
				return null;
			}

			using var transaction = _repository.BeginTransaction();
			try
			{
				var details = await GetDbContext().InvoiceDetails
					.Where(x => x.invoice_id == id)
					.ToListAsync();

				if (details.Count > 0)
				{
					GetDbContext().InvoiceDetails.RemoveRange(details);
					await GetDbContext().SaveChangesAsync();
				}

				var paymentId = invoice.payment_id;

				GetDbContext().Invoices.Remove(invoice);
				await GetDbContext().SaveChangesAsync();

				if (paymentId.HasValue)
				{
					var payment = await GetDbContext().Payments.FirstOrDefaultAsync(x => x.id == paymentId.Value);
					if (payment != null)
					{
						GetDbContext().Payments.Remove(payment);
						await GetDbContext().SaveChangesAsync();
					}
				}

				await transaction.CommitAsync();
				return true;
			}
			catch
			{
				await transaction.RollbackAsync();
				throw;
			}
		}

		private async Task<InvoiceDetailDto?> BuildInvoiceDetailAsync(Invoice invoice)
		{
			if (!invoice.booking_id.HasValue)
			{
				return null;
			}

			var invoiceDetail = await GetDbContext().InvoiceDetailViews
				.AsNoTracking()
				.FirstOrDefaultAsync(x => x.Id == invoice.id);
			if (invoiceDetail == null)
			{
				return null;
			}

			var booking = await GetDbContext().Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.id == invoice.booking_id.Value);
			if (booking == null)
			{
				return null;
			}

			var detailItems = await GetDbContext().InvoiceDetails
				.AsNoTracking()
				.Where(x => x.invoice_id == invoice.id)
				.ToListAsync();

			var calculation = await BuildCalculationAsync(booking, detailItems.Select(x => new InvoiceServiceItemDto
			{
				ServiceDetailId = x.servicedetail_id ?? 0,
				Quantity = x.quantity ?? 1,
				UseDate = x.use_date,
				VoucherId = x.voucher_id
			}).Where(x => x.ServiceDetailId > 0).ToList());

			if (calculation == null)
			{
				return null;
			}

			return new InvoiceDetailDto
			{
				Id = invoiceDetail.Id,
				BookingId = invoiceDetail.BookingId,
				CustomerName = invoiceDetail.CustomerName,
				CustomerPhone = invoiceDetail.CustomerPhone,
				RoomName = invoiceDetail.RoomName,
				EmployeeName = invoiceDetail.EmployeeName,
				IssueDate = invoiceDetail.IssueDate,
				PaymentDetails = invoiceDetail.PaymentDetails,
				Nights = invoiceDetail.Nights,
				RoomUnitPrice = invoiceDetail.RoomUnitPrice,
				RoomCharge = invoiceDetail.RoomCharge,
				ServiceCharge = invoiceDetail.ServiceCharge,
				TotalAmount = invoiceDetail.TotalAmount,
				ServiceLines = calculation.ServiceLines
			};
		}

		private async Task<InvoiceCalculationDto?> BuildCalculationAsync(Booking booking, List<InvoiceServiceItemDto> serviceItems)
		{
			var room = booking.room_id.HasValue
				? await GetDbContext().Rooms.AsNoTracking().FirstOrDefaultAsync(x => x.id == booking.room_id.Value)
				: null;
			if (room == null)
			{
				return null;
			}

			var customer = booking.user_id.HasValue
				? await GetDbContext().Customers.AsNoTracking().FirstOrDefaultAsync(x => x.userid == booking.user_id.Value)
				: null;

			var nights = CalculateNights(booking.date_start, booking.date_end);
			var roomUnitPrice = room.price ?? 0m;
			var roomDiscountPercent = await ResolveVoucherPercentAsync(booking.voucher_id);
			var roomCharge = nights * roomUnitPrice * (1 - roomDiscountPercent / 100m);

			var serviceLines = new List<InvoiceChargeLineDto>();
			foreach (var item in serviceItems)
			{
				var service = await GetDbContext().ServiceDetails.AsNoTracking().FirstOrDefaultAsync(x => x.id == item.ServiceDetailId);
				if (service == null)
				{
					return null;
				}

				var quantity = item.Quantity <= 0 ? 1 : item.Quantity;
				var unitPrice = service.price ?? 0m;
				var discountPercent = await ResolveVoucherPercentAsync(item.VoucherId);
				var lineTotal = quantity * unitPrice * (1 - discountPercent / 100m);

				serviceLines.Add(new InvoiceChargeLineDto
				{
					ServiceDetailId = service.id,
					Name = service.name_service,
					Quantity = quantity,
					UnitPrice = unitPrice,
					DiscountPercent = discountPercent,
					LineTotal = lineTotal,
					UseDate = item.UseDate
				});
			}

			var serviceCharge = serviceLines.Sum(x => x.LineTotal);

			return new InvoiceCalculationDto
			{
				BookingId = booking.id,
				CustomerName = customer?.fullname ?? string.Empty,
				RoomName = room.room_name,
				Nights = nights,
				RoomUnitPrice = roomUnitPrice,
				RoomCharge = roomCharge,
				ServiceCharge = serviceCharge,
				TotalAmount = roomCharge + serviceCharge,
				ServiceLines = serviceLines
			};
		}

		private async Task<decimal> ResolveVoucherPercentAsync(int? voucherId)
		{
			if (!voucherId.HasValue)
			{
				return 0m;
			}

			var voucher = await GetDbContext().Vouchers.AsNoTracking().FirstOrDefaultAsync(x => x.id == voucherId.Value);
			if (voucher == null)
			{
				return 0m;
			}

			var now = DateTime.Now.Date;
			if (voucher.date_start.HasValue && voucher.date_start.Value.Date > now)
			{
				return 0m;
			}

			if (voucher.date_end.HasValue && voucher.date_end.Value.Date < now)
			{
				return 0m;
			}

			return voucher.voucher_percent ?? 0m;
		}

		private static int CalculateNights(DateTime? startDate, DateTime? endDate)
		{
			if (!startDate.HasValue || !endDate.HasValue)
			{
				return 1;
			}

			var nights = (endDate.Value.Date - startDate.Value.Date).Days;
			return nights <= 0 ? 1 : nights;
		}

		private HotelManagementContext GetDbContext()
		{
			return _repository.GetDbContext<HotelManagementContext>();
		}
	}
}
