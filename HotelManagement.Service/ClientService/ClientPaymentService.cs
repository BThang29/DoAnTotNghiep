using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Payments;
using DoAnWebQuanLyKhachSan.Service.Dtos.Payments;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
    public class ClientPaymentService
    {
        private readonly HotelManagementRepository _repository;
        private readonly BaseService _baseService;
        private readonly PaymentService _paymentService;
        private readonly EmailService _emailService;

        public ClientPaymentService(HotelManagementRepository repository, PaymentService paymentService, EmailService emailService, IMapper mapper)
        {
            _repository = repository;
            _baseService = new BaseService(repository, mapper);
            _paymentService = paymentService;
            _emailService = emailService;
        }

        public Task<List<PaymentMethodDto>> GetPaymentMethods()
        {
            return _paymentService.GetPaymentMethods();
        }

        public Task<PaymentDetailDto?> GetPaymentById(int id)
        {
            return _paymentService.GetPaymentById(id);
        }

        public async Task<int?> CreateOnlinePayment(ClientOnlinePaymentCreateDto model, int? currentUserId = null)
        {
            var booking = await GetDbContext().Bookings.FirstOrDefaultAsync(x => x.id == model.BookingId);
            if (booking == null)
            {
                return null;
            }

            if (!CanAccessBooking(booking, currentUserId, model.BookingAccessToken))
            {
                return -5;
            }

            if (booking.booking_status == ClientBookingStatus.Cancelled)
            {
                return -6;
            }

            var existingInvoiceId = await GetDbContext().Invoices.AsNoTracking()
                .Where(x => x.booking_id == model.BookingId)
                .Select(x => (int?)x.id)
                .FirstOrDefaultAsync();
            if (existingInvoiceId.HasValue)
            {
                return existingInvoiceId.Value;
            }

            if (booking.booking_status == ClientBookingStatus.Paid)
            {
                return -3;
            }

            using var transaction = _repository.BeginTransaction();

            var paymentId = await _paymentService.CreatePayment(new PaymentCreateDto
            {
                Method = model.Method,
                AccountName = model.AccountName,
                AccountNumber = model.AccountNumber,
                BankName = model.BankName,
                QrContent = model.QrContent,
                Note = model.Note
            });

            if (!paymentId.HasValue)
            {
                return -4;
            }

            if (paymentId.Value == -2)
            {
                return -2;
            }

            var invoice = new Invoice
            {
                booking_id = model.BookingId,
                issue_date = DateTime.Now,
                payment_id = paymentId.Value
            };

            GetDbContext().Invoices.Add(invoice);
            booking.booking_status = ClientBookingStatus.Paid;
            await GetDbContext().SaveChangesAsync();
            transaction.Commit();

            await TrySendPaymentSuccessEmailAsync(booking.id, invoice.id);

            return invoice.id;
        }

        public async Task<ClientOnlinePaymentResultDto?> GetOnlinePaymentResult(int invoiceId)
        {
            var viewResult = await _baseService.FindAsync<ClientOnlinePaymentResultView, ClientOnlinePaymentResultDto>(x => x.InvoiceId == invoiceId);
            if (viewResult != null)
            {
                return viewResult;
            }

            return await BuildOnlinePaymentResultFallbackAsync(invoiceId);
        }

        private HotelManagementContext GetDbContext()
        {
            return _repository.GetDbContext<HotelManagementContext>();
        }

        private async Task TrySendPaymentSuccessEmailAsync(int bookingId, int invoiceId)
        {
            var db = GetDbContext();
            var emailPayload = await (from booking in db.Bookings.AsNoTracking()
                                      where booking.id == bookingId
                                      join room in db.Rooms.AsNoTracking() on booking.room_id equals room.id into roomGroup
                                      from room in roomGroup.DefaultIfEmpty()
                                      join invoice in db.Invoices.AsNoTracking() on booking.id equals invoice.booking_id into invoiceGroup
                                      from invoice in invoiceGroup.DefaultIfEmpty()
                                      join payment in db.Payments.AsNoTracking() on invoice.payment_id equals payment.id into paymentGroup
                                      from payment in paymentGroup.DefaultIfEmpty()
                                      join customer in db.Customers.AsNoTracking() on booking.user_id equals customer.userid into customerGroup
                                      from customer in customerGroup.DefaultIfEmpty()
                                      join user in db.Users.AsNoTracking() on booking.user_id equals user.Id into userGroup
                                      from user in userGroup.DefaultIfEmpty()
                                      where invoice != null && invoice.id == invoiceId
                                      select new
                                      {
                                          CustomerName = !string.IsNullOrWhiteSpace(booking.guest_full_name)
                                              ? booking.guest_full_name
                                              : customer != null && !string.IsNullOrWhiteSpace(customer.fullname)
                                              ? customer.fullname
                                              : (user != null ? user.FullName : string.Empty),
                                          CustomerEmail = !string.IsNullOrWhiteSpace(booking.guest_email)
                                              ? booking.guest_email
                                              : customer != null && !string.IsNullOrWhiteSpace(customer.mail)
                                              ? customer.mail
                                              : (user != null ? user.Email : string.Empty),
                                          RoomName = room != null ? room.room_name : string.Empty,
                                          RoomPrice = room != null ? room.price : null,
                                          booking.date_start,
                                          booking.date_end,
                                          booking.deposit,
                                          PaymentMethod = payment != null ? payment.method : string.Empty,
                                          invoice.issue_date
                                      }).FirstOrDefaultAsync();

            if (emailPayload == null || string.IsNullOrWhiteSpace(emailPayload.CustomerEmail))
            {
                return;
            }

            var bookingDetail = await GetDbContext().BookingDetailViews
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == bookingId);
            var totalAmount = await GetDbContext().ClientOnlinePaymentResultViews
                .AsNoTracking()
                .Where(x => x.InvoiceId == invoiceId)
                .Select(x => x.TotalAmount)
                .FirstOrDefaultAsync();
            var paidAmount = Math.Max(0m, totalAmount - (emailPayload.deposit ?? 0m));

            try
            {
                await _emailService.SendPaymentCompletedEmail(
                    emailPayload.CustomerEmail,
                    string.IsNullOrWhiteSpace(emailPayload.CustomerName) ? "Khach hang" : emailPayload.CustomerName,
                    invoiceId,
                    bookingId,
                    emailPayload.RoomName ?? $"Phong {bookingDetail?.RoomId ?? 0}",
                    emailPayload.RoomPrice,
                    emailPayload.date_start ?? DateTime.Now,
                    emailPayload.date_end ?? DateTime.Now,
                    emailPayload.deposit,
                    paidAmount,
                    emailPayload.PaymentMethod ?? "Cash",
                    emailPayload.issue_date ?? DateTime.Now);
            }
            catch
            {
                // Best-effort: khong de gui mail lam hong luong thanh toan.
            }
        }

        private async Task<ClientOnlinePaymentResultDto?> BuildOnlinePaymentResultFallbackAsync(int invoiceId)
        {
            var db = GetDbContext();

            var payload = await (from invoice in db.Invoices.AsNoTracking()
                                 where invoice.id == invoiceId
                                 join payment in db.Payments.AsNoTracking() on invoice.payment_id equals payment.id
                                 join booking in db.Bookings.AsNoTracking() on invoice.booking_id equals booking.id into bookingGroup
                                 from booking in bookingGroup.DefaultIfEmpty()
                                 join room in db.Rooms.AsNoTracking() on booking.room_id equals room.id into roomGroup
                                 from room in roomGroup.DefaultIfEmpty()
                                 select new
                                 {
                                     PaymentId = payment.id,
                                     InvoiceId = invoice.id,
                                     Method = payment.method,
                                     invoice.issue_date,
                                     RoomPrice = room != null ? room.price : 0m,
                                     booking.date_start,
                                     booking.date_end
                                 }).FirstOrDefaultAsync();

            if (payload == null)
            {
                return null;
            }

            var paymentDetail = await _paymentService.GetPaymentById(payload.PaymentId);

            var totalAmount = await db.InvoiceDetailViews
                .AsNoTracking()
                .Where(x => x.Id == invoiceId)
                .Select(x => (decimal?)x.TotalAmount)
                .FirstOrDefaultAsync();

            if (!totalAmount.HasValue)
            {
                var nights = 1;
                if (payload.date_start.HasValue && payload.date_end.HasValue)
                {
                    nights = Math.Max(1, (payload.date_end.Value.Date - payload.date_start.Value.Date).Days);
                }

                totalAmount = payload.RoomPrice * nights;
            }

            return new ClientOnlinePaymentResultDto
            {
                PaymentId = payload.PaymentId,
                InvoiceId = payload.InvoiceId,
                Method = payload.Method ?? string.Empty,
                QrContent = paymentDetail?.QrContent ?? string.Empty,
                Note = paymentDetail?.Note ?? string.Empty,
                TotalAmount = totalAmount ?? 0m,
                IssueDate = payload.issue_date
            };
        }

        private static bool CanAccessBooking(Booking booking, int? currentUserId, string? guestAccessToken)
        {
            if (currentUserId.HasValue && currentUserId.Value > 0 && booking.user_id == currentUserId.Value)
            {
                return true;
            }

            var normalizedToken = Normalize(guestAccessToken);
            return !string.IsNullOrWhiteSpace(normalizedToken)
                && string.Equals(booking.guest_access_token, normalizedToken, StringComparison.Ordinal);
        }

        private static string? Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
