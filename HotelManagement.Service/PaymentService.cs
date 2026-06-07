using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Payments;
using DoAnWebQuanLyKhachSan.Utils.Repository;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;

namespace DoAnWebQuanLyKhachSan.Service
{
	public class PaymentService
	{
		private const string CashMethod = "Cash";
		private const string BankTransferMethod = "BankTransfer";
		private const string MomoCodeMethod = "Momo";

		private readonly HotelManagementRepository _repository;

		public PaymentService(HotelManagementRepository repository, IMapper mapper)
		{
			_repository = repository;
		}

		public async Task<PagingResult<PaymentGridDto>> GetPayments(PaymentGridPagingDto pagingModel)
		{
			pagingModel ??= new PaymentGridPagingDto();
			if (pagingModel.ItemsPerPage != -1 && pagingModel.ItemsPerPage <= 0)
			{
				pagingModel.ItemsPerPage = PagingParams<PaymentGridDto>.DefaultPageSize;
			}

			if (pagingModel.Page <= 0)
			{
				pagingModel.Page = 1;
			}

			var query = BuildPaymentGridQuery();

			if (!string.IsNullOrWhiteSpace(pagingModel.Method))
			{
				var method = pagingModel.Method.Trim();
				query = query.Where(x => x.Method == method);
			}

			if (!string.IsNullOrWhiteSpace(pagingModel.Keyword))
			{
				var keyword = pagingModel.Keyword.Trim();
				query = query.Where(x =>
					x.Method.Contains(keyword) ||
					x.AccountName.Contains(keyword) ||
					x.AccountNumber.Contains(keyword) ||
					x.BankName.Contains(keyword) ||
					x.Note.Contains(keyword));
			}

			var result = new PagingResult<PaymentGridDto>
			{
				PageSize = pagingModel.ItemsPerPage,
				CurrentPage = pagingModel.Page,
				TotalRows = await query.CountAsync()
			};

			query = query.OrderBy(pagingModel.SortExpression);

			if (pagingModel.StartingIndex > 0)
			{
				query = query.Skip(pagingModel.StartingIndex);
			}

			if (pagingModel.ItemsPerPage > 0)
			{
				query = query.Take(pagingModel.ItemsPerPage);
			}

			result.Data = await query.ToListAsync();
			return result;
		}

		public async Task<PaymentDetailDto?> GetPaymentById(int id)
		{
			return await BuildPaymentDetailQuery().FirstOrDefaultAsync(x => x.Id == id);
		}

		public async Task<int?> CreatePayment(PaymentCreateDto model)
		{
			var normalizedMethod = NormalizeMethod(model.Method);
			if (normalizedMethod == null)
			{
				return null;
			}

			if (!IsValidPaymentModel(normalizedMethod, model.AccountNumber, model.BankName, model.QrContent))
			{
				return -2;
			}

			var payment = new Payment
			{
				method = normalizedMethod,
				name_account = Normalize(model.AccountName),
				account_number = Normalize(model.AccountNumber),
				bank_name = Normalize(model.BankName)
			};

			GetDbContext().Payments.Add(payment);
			await GetDbContext().SaveChangesAsync();
			return payment.id;
		}

		public async Task<bool?> UpdatePayment(int id, PaymentUpdateDto model)
		{
			var payment = await GetDbContext().Payments.FirstOrDefaultAsync(x => x.id == id);
			if (payment == null)
			{
				return null;
			}

			var normalizedMethod = NormalizeMethod(model.Method);
			if (normalizedMethod == null)
			{
				return false;
			}

			if (!IsValidPaymentModel(normalizedMethod, model.AccountNumber, model.BankName, model.QrContent))
			{
				return false;
			}

			payment.method = normalizedMethod;
			payment.name_account = Normalize(model.AccountName);
			payment.account_number = Normalize(model.AccountNumber);
			payment.bank_name = Normalize(model.BankName);

			await GetDbContext().SaveChangesAsync();
			return true;
		}

		public async Task<int?> DeletePayment(int id)
		{
			var payment = await GetDbContext().Payments.FirstOrDefaultAsync(x => x.id == id);
			if (payment == null)
			{
				return null;
			}

			var hasInvoice = await GetDbContext().Invoices.AsNoTracking().AnyAsync(x => x.payment_id == id);
			if (hasInvoice)
			{
				return -2;
			}

			GetDbContext().Payments.Remove(payment);
			await GetDbContext().SaveChangesAsync();
			return id;
		}

		public Task<List<PaymentMethodDto>> GetPaymentMethods()
		{
			return Task.FromResult(new List<PaymentMethodDto>
			{
				new PaymentMethodDto { Value = CashMethod, Name = "Tien mat" },
				new PaymentMethodDto { Value = BankTransferMethod, Name = "Chuyen khoan" },
				new PaymentMethodDto { Value = MomoCodeMethod, Name = "Momo" }
			});
		}

		public async Task<PaymentQrDto?> GetPaymentQr(int id)
		{
			var payment = await GetPaymentById(id);
			if (payment == null)
			{
				return null;
			}

			if (!payment.Method.Equals(MomoCodeMethod, StringComparison.OrdinalIgnoreCase) &&
				!payment.Method.Equals(BankTransferMethod, StringComparison.OrdinalIgnoreCase))
			{
				return new PaymentQrDto
				{
					Id = payment.Id,
					Method = payment.Method,
					AccountName = payment.AccountName,
					AccountNumber = payment.AccountNumber,
					BankName = payment.BankName,
					QrContent = string.Empty
				};
			}

			return new PaymentQrDto
			{
				Id = payment.Id,
				Method = payment.Method,
				AccountName = payment.AccountName,
				AccountNumber = payment.AccountNumber,
				BankName = payment.BankName,
				QrContent = payment.QrContent
			};
		}

		private HotelManagementContext GetDbContext()
		{
			return _repository.GetDbContext<HotelManagementContext>();
		}

		private IQueryable<PaymentDetailDto> BuildPaymentDetailQuery()
		{
			return from payment in GetDbContext().Payments.AsNoTracking()
				   join invoice in GetDbContext().Invoices.AsNoTracking()
					   on payment.id equals invoice.payment_id into invoiceGroup
				   from invoice in invoiceGroup.DefaultIfEmpty()
				   select new PaymentDetailDto
				   {
					   Id = payment.id,
					   Method = payment.method ?? CashMethod,
					   AccountName = payment.name_account ?? string.Empty,
					   AccountNumber = payment.account_number ?? string.Empty,
					   BankName = payment.bank_name ?? string.Empty,
					   QrContent = BuildQrContent(
						   payment.method ?? CashMethod,
						   null,
						   payment.account_number,
						   payment.bank_name,
						   payment.name_account),
					   Note = string.Empty,
					   InvoiceId = invoice != null ? invoice.id : null
				   };
		}

		private IQueryable<PaymentGridDto> BuildPaymentGridQuery()
		{
			return BuildPaymentDetailQuery().Select(x => new PaymentGridDto
			{
				Id = x.Id,
				Method = x.Method,
				AccountName = x.AccountName,
				AccountNumber = x.AccountNumber,
				BankName = x.BankName,
				Note = x.Note,
				InvoiceId = x.InvoiceId
			});
		}

		private static string? NormalizeMethod(string? method)
		{
			return (method ?? string.Empty).Trim().ToLowerInvariant() switch
			{
				"cash" => CashMethod,
				"banktransfer" => BankTransferMethod,
				"momo" => MomoCodeMethod,
				_ => null
			};
		}

		private static bool IsValidPaymentModel(string method, string? accountNumber, string? bankName, string? qrContent)
		{
			if (method == CashMethod)
			{
				return true;
			}

			if (string.IsNullOrWhiteSpace(accountNumber) || string.IsNullOrWhiteSpace(bankName))
			{
				return false;
			}

			if (method == MomoCodeMethod)
			{
				return !string.IsNullOrWhiteSpace(qrContent) || (!string.IsNullOrWhiteSpace(accountNumber) && !string.IsNullOrWhiteSpace(bankName));
			}

			return true;
		}

		private static string BuildQrContent(string method, string? qrContent, string? accountNumber, string? bankName, string? accountName)
		{
			if (!method.Equals(MomoCodeMethod, StringComparison.OrdinalIgnoreCase) &&
				!method.Equals(BankTransferMethod, StringComparison.OrdinalIgnoreCase))
			{
				return string.Empty;
			}

			if (!string.IsNullOrWhiteSpace(qrContent))
			{
				return qrContent.Trim();
			}

			return $"BANK:{Normalize(bankName)}|ACCOUNT:{Normalize(accountNumber)}|NAME:{Normalize(accountName)}";
		}

		private static string? Normalize(string? value)
		{
			return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
		}
	}
}
