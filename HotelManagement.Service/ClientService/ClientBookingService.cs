using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Bookings;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace DoAnWebQuanLyKhachSan.Service
{
    public class ClientBookingService
    {
        private readonly HotelManagementRepository _repository;
        private readonly EmailService _emailService;

        public ClientBookingService(HotelManagementRepository repository, EmailService emailService)
        {
            _repository = repository;
            _emailService = emailService;
        }

        public async Task<ClientBookingDetailDto?> GetBookingById(int id)
        {
            var db = GetDbContext();
            return await (from booking in db.Bookings.AsNoTracking()
                          where booking.id == id
                          join room in db.Rooms.AsNoTracking() on booking.room_id equals room.id into roomGroup
                          from room in roomGroup.DefaultIfEmpty()
                          join voucher in db.Vouchers.AsNoTracking() on booking.voucher_id equals voucher.id into voucherGroup
                          from voucher in voucherGroup.DefaultIfEmpty()
                          join customer in db.Customers.AsNoTracking() on booking.user_id equals customer.userid into customerGroup
                          from customer in customerGroup.DefaultIfEmpty()
                          join user in db.Users.AsNoTracking() on booking.user_id equals user.Id into userGroup
                          from user in userGroup.DefaultIfEmpty()
                          select new ClientBookingDetailDto
                          {
                              Id = booking.id,
                              CustomerId = customer != null ? customer.id : null,
                              CustomerName = !string.IsNullOrWhiteSpace(booking.guest_full_name)
                                  ? booking.guest_full_name
                                  : (customer != null && !string.IsNullOrWhiteSpace(customer.fullname)
                                      ? customer.fullname
                                      : (user != null ? user.FullName : string.Empty)),
                              CustomerPhone = customer != null && !string.IsNullOrWhiteSpace(customer.phone)
                                  ? customer.phone
                                  : (user != null ? user.PhoneNumber ?? string.Empty : string.Empty),
                              RoomId = booking.room_id,
                              RoomName = room != null ? room.room_name ?? string.Empty : string.Empty,
                              RoomPrice = room != null ? room.price : null,
                              DateBooking = booking.date_booking,
                              BookingExpire = booking.booking_exprire,
                              DateStart = booking.date_start,
                              DateEnd = booking.date_end,
                              Deposit = booking.deposit,
                              BookingStatus = booking.booking_status,
                              VoucherId = booking.voucher_id,
                              VoucherCode = voucher != null ? voucher.voucher_code ?? string.Empty : string.Empty
                          }).FirstOrDefaultAsync();
        }

        public async Task<int?> CreateBooking(ClientBookingCreateDto model, int? currentUserId = null)
        {
            var db = GetDbContext();
            var room = await db.Rooms.FirstOrDefaultAsync(x => x.id == model.RoomId);
            if (room == null)
            {
                return -2;
            }

            if (!string.Equals(room.room_status, "AVAILABLE", StringComparison.OrdinalIgnoreCase))
            {
                return -5;
            }

            string? voucherCode = null;
            if (model.VoucherId.HasValue)
            {
                var voucher = await db.Vouchers.AsNoTracking().FirstOrDefaultAsync(x => x.id == model.VoucherId.Value);
                if (voucher == null || !IsVoucherActive(voucher, model.DateStart))
                {
                    return -3;
                }

                voucherCode = voucher.voucher_code;
            }

            var hasConflict = await GetDbContext().Bookings
                .AsNoTracking()
                .AnyAsync(x => x.room_id == model.RoomId
                    && x.booking_status != ClientBookingStatus.Cancelled
                    && x.date_start.HasValue
                    && x.date_end.HasValue
                    && x.date_start.Value.Date <= model.DateEnd.Date
                    && model.DateStart.Date <= x.date_end.Value.Date);
            if (hasConflict)
            {
                return -4;
            }

            var customer = await ResolveCustomerAsync(model, currentUserId);
            var bookingUserId = currentUserId.HasValue && currentUserId.Value > 0
                ? currentUserId.Value
                : customer.userid;

            var bookingCreatedAt = DateTime.Now;
            var booking = new Booking
            {
                user_id = bookingUserId,
                room_id = model.RoomId,
                date_booking = bookingCreatedAt,
                booking_exprire = bookingCreatedAt.AddMinutes(10),
                date_start = model.DateStart,
                date_end = model.DateEnd,
                deposit = model.Deposit,
                voucher_id = model.VoucherId,
                booking_status = ClientBookingStatus.PendingPayment,
                guest_full_name = model.FullName.Trim(),
                guest_email = Normalize(model.Mail),
                guest_access_token = GenerateGuestAccessToken()
            };

            db.Bookings.Add(booking);
            room.room_status = "OCCUPIED";
            await db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(customer.mail))
            {
                try
                {
                    await _emailService.SendBookingCreatedEmail(
                        customer.mail,
                        customer.fullname ?? "Khach hang",
                        booking.id,
                        room.room_name ?? $"Phong {room.id}",
                        room.price,
                        model.DateStart,
                        model.DateEnd,
                        model.Deposit,
                        voucherCode);
                }
                catch
                {
                    // Best-effort: khong de loi gui mail lam hong luong tao booking.
                }
            }

            return booking.id;
        }

        public async Task<ClientBookingResultDto?> GetBookingResult(int bookingId)
        {
            var detail = await GetBookingById(bookingId);
            if (detail == null)
            {
                return null;
            }

            var result = new ClientBookingResultDto
            {
                BookingId = detail.Id,
                CustomerId = detail.CustomerId ?? 0,
                CustomerName = detail.CustomerName,
                RoomId = detail.RoomId ?? 0,
                RoomName = detail.RoomName,
                RoomPrice = detail.RoomPrice,
                DateStart = detail.DateStart ?? DateTime.MinValue,
                DateEnd = detail.DateEnd ?? DateTime.MinValue,
                Deposit = detail.Deposit,
                BookingStatus = detail.BookingStatus
            };

            result.GuestAccessToken = await GetDbContext().Bookings
                .AsNoTracking()
                .Where(x => x.id == bookingId)
                .Select(x => x.guest_access_token ?? string.Empty)
                .FirstOrDefaultAsync();

            return result;
        }

        public async Task<bool> CanAccessBooking(int bookingId, int? currentUserId, string? guestAccessToken)
        {
            var booking = await GetDbContext().Bookings
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.id == bookingId);
            if (booking == null)
            {
                return false;
            }

            return CanAccessBooking(booking, currentUserId, guestAccessToken);
        }

        public async Task<int> CancelPendingBooking(int bookingId, int? currentUserId = null, string? guestAccessToken = null, bool forceCancel = false)
        {
            var db = GetDbContext();
            var booking = await db.Bookings.FirstOrDefaultAsync(x => x.id == bookingId);
            if (booking == null)
            {
                return -1;
            }

            if (!CanAccessBooking(booking, currentUserId, guestAccessToken))
            {
                return -5;
            }

            if (booking.booking_status == ClientBookingStatus.Cancelled)
            {
                return -6;
            }

            if (booking.booking_status == ClientBookingStatus.Paid)
            {
                return -2;
            }

            var paymentDeadline = booking.booking_exprire ?? (booking.date_booking ?? DateTime.Now).AddMinutes(10);
            if (!forceCancel && paymentDeadline > DateTime.Now)
            {
                return -3;
            }

            var roomId = booking.room_id;
            booking.booking_status = ClientBookingStatus.Cancelled;

            if (roomId.HasValue)
            {
                var hasOtherBookings = await db.Bookings
                    .AsNoTracking()
                    .AnyAsync(x => x.id != bookingId
                        && x.room_id == roomId.Value
                        && x.booking_status != ClientBookingStatus.Cancelled);
                if (!hasOtherBookings)
                {
                    var room = await db.Rooms.FirstOrDefaultAsync(x => x.id == roomId.Value);
                    if (room != null
                        && string.Equals(room.room_status, "OCCUPIED", StringComparison.OrdinalIgnoreCase))
                    {
                        room.room_status = "AVAILABLE";
                    }
                }
            }

            await db.SaveChangesAsync();

            return 1;
        }

        private async Task<Customer> ResolveCustomerAsync(ClientBookingCreateDto model, int? currentUserId)
        {
            var db = GetDbContext();
            Customer? customer = null;
            var userId = currentUserId.HasValue && currentUserId.Value > 0 ? currentUserId.Value : (int?)null;

            if (userId.HasValue)
            {
                customer = await db.Customers.FirstOrDefaultAsync(x => x.userid == userId.Value);
            }

            if (!string.IsNullOrWhiteSpace(model.Identify))
            {
                var identify = model.Identify.Trim();
                customer ??= await db.Customers.FirstOrDefaultAsync(x => x.identify == identify);
            }

            if (customer == null && !string.IsNullOrWhiteSpace(model.Phone))
            {
                var phone = model.Phone.Trim();
                customer = await db.Customers.FirstOrDefaultAsync(x => x.phone == phone);
            }

            if (customer == null && !string.IsNullOrWhiteSpace(model.Mail))
            {
                var mail = model.Mail.Trim();
                customer = await db.Customers.FirstOrDefaultAsync(x => x.mail == mail);
            }

            if (customer == null)
            {
                customer = new Customer
                {
                    userid = userId,
                    fullname = model.FullName.Trim(),
                    identify = Normalize(model.Identify),
                    phone = Normalize(model.Phone),
                    mail = Normalize(model.Mail),
                    dob = Convert.ToDateTime(model.Dob)
                };

                db.Customers.Add(customer);
            }
            else
            {
                customer.userid = userId ?? customer.userid;
                customer.fullname = model.FullName.Trim();
                customer.identify = Normalize(model.Identify) ?? customer.identify;
                customer.phone = Normalize(model.Phone) ?? customer.phone;
                customer.mail = Normalize(model.Mail) ?? customer.mail;
                customer.dob = model.Dob ?? customer.dob;
            }

            await db.SaveChangesAsync();
            return customer;
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

        private static string GenerateGuestAccessToken()
        {
            Span<byte> buffer = stackalloc byte[24];
            RandomNumberGenerator.Fill(buffer);
            return Convert.ToBase64String(buffer)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", string.Empty);
        }

        private static bool IsVoucherActive(Voucher voucher, DateTime referenceDate)
        {
            var date = referenceDate.Date;
            if (voucher.date_start.HasValue && voucher.date_start.Value.Date > date)
            {
                return false;
            }

            if (voucher.date_end.HasValue && voucher.date_end.Value.Date < date)
            {
                return false;
            }

            return true;
        }

        private HotelManagementContext GetDbContext()
        {
            return _repository.GetDbContext<HotelManagementContext>();
        }
    }
}
