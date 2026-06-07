using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.BookingHistories;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
    public class ClientBookingHistoryService
    {
        private readonly HotelManagementRepository _repository;

        public ClientBookingHistoryService(HotelManagementRepository repository, IMapper mapper)
        {
            _repository = repository;
        }

        public async Task<PagingResult<ClientBookingHistoryDto>> GetBookingHistories(ClientBookingHistoryPagingDto query)
        {
            query ??= new ClientBookingHistoryPagingDto();
            if (query.ItemsPerPage != -1 && query.ItemsPerPage <= 0)
            {
                query.ItemsPerPage = PagingParams<ClientBookingHistoryDto>.DefaultPageSize;
            }

            if (query.Page <= 0)
            {
                query.Page = 1;
            }

            var db = _repository.GetDbContext<HotelManagementContext>();
            var bookingQuery =
                from booking in db.Bookings.AsNoTracking()
                join customer in db.Customers.AsNoTracking() on booking.user_id equals customer.userid into customerGroup
                from customer in customerGroup.DefaultIfEmpty()
                join user in db.Users.AsNoTracking() on booking.user_id equals user.Id into userGroup
                from user in userGroup.DefaultIfEmpty()
                join room in db.Rooms.AsNoTracking() on booking.room_id equals room.id into roomGroup
                from room in roomGroup.DefaultIfEmpty()
                join voucher in db.Vouchers.AsNoTracking() on booking.voucher_id equals voucher.id into voucherGroup
                from voucher in voucherGroup.DefaultIfEmpty()
                join invoice in db.Invoices.AsNoTracking() on booking.id equals invoice.booking_id into invoiceGroup
                from invoice in invoiceGroup.DefaultIfEmpty()
                join review in db.Reviews.AsNoTracking() on booking.id equals review.booking_id into reviewGroup
                from review in reviewGroup.DefaultIfEmpty()
                join invoiceDetail in db.InvoiceDetailViews.AsNoTracking() on invoice.id equals invoiceDetail.Id into invoiceDetailGroup
                select new ClientBookingHistoryDto
                {
                    BookingHistoryId = null,
                    BookingId = booking.id,
                    InvoiceId = invoice != null ? invoice.id : null,
                    UserId = booking.user_id,
                    CustomerId = customer != null ? customer.id : null,
                    CustomerName = !string.IsNullOrWhiteSpace(booking.guest_full_name)
                        ? booking.guest_full_name
                        : customer != null && !string.IsNullOrWhiteSpace(customer.fullname)
                            ? customer.fullname
                            : user != null ? user.FullName : string.Empty,
                    CustomerPhone = customer != null && !string.IsNullOrWhiteSpace(customer.phone)
                        ? customer.phone
                        : user != null ? user.PhoneNumber ?? string.Empty : string.Empty,
                    CustomerMail = !string.IsNullOrWhiteSpace(booking.guest_email)
                        ? booking.guest_email
                        : customer != null && !string.IsNullOrWhiteSpace(customer.mail)
                            ? customer.mail
                            : user != null ? user.Email ?? string.Empty : string.Empty,
                    RoomId = booking.room_id,
                    RoomName = room != null ? room.room_name ?? string.Empty : string.Empty,
                    DateBooking = booking.date_booking,
                    DateStart = booking.date_start,
                    DateEnd = booking.date_end,
                    Deposit = booking.deposit,
                    TotalAmount = invoiceDetailGroup.Select(x => (decimal?)x.TotalAmount).FirstOrDefault()
                        ?? (
                            (
                                booking.date_start.HasValue
                                && booking.date_end.HasValue
                                && EF.Functions.DateDiffDay(booking.date_start.Value, booking.date_end.Value) > 0
                            )
                                ? EF.Functions.DateDiffDay(booking.date_start.Value, booking.date_end.Value) * (room != null ? (room.price ?? 0m) : 0m)
                                : (room != null ? (room.price ?? 0m) : 0m)
                        ) * (1 - ((voucher != null ? (voucher.voucher_percent ?? 0m) : 0m) / 100m)),
                    Feedback = review != null ? review.feedback ?? string.Empty : string.Empty,
                    Status = booking.booking_status == ClientBookingStatus.Paid
                        ? "Đã thanh toán"
                        : booking.booking_status == ClientBookingStatus.Cancelled
                            ? "Đã hủy"
                            : "Chưa thanh toán"
                };

            foreach (var predicate in query.GetPredicates())
            {
                bookingQuery = bookingQuery.Where(predicate);
            }

            bookingQuery = !string.IsNullOrWhiteSpace(query.SortBy)
                ? ApplySort(bookingQuery, query.SortBy.Trim(), query.SortDesc)
                : bookingQuery.OrderByDescending(x => x.DateBooking);

            var result = new PagingResult<ClientBookingHistoryDto>
            {
                PageSize = query.ItemsPerPage,
                CurrentPage = query.Page,
                TotalRows = await bookingQuery.CountAsync()
            };

            if (query.StartingIndex > 0)
            {
                bookingQuery = bookingQuery.Skip(query.StartingIndex);
            }

            if (query.ItemsPerPage > 0)
            {
                bookingQuery = bookingQuery.Take(query.ItemsPerPage);
            }

            result.Data = await bookingQuery.ToListAsync();
            return result;
        }

        private static IQueryable<ClientBookingHistoryDto> ApplySort(IQueryable<ClientBookingHistoryDto> query, string sortBy, bool sortDesc)
        {
            return (sortBy, sortDesc) switch
            {
                ("DateStart", true) => query.OrderByDescending(x => x.DateStart),
                ("DateStart", false) => query.OrderBy(x => x.DateStart),
                ("DateEnd", true) => query.OrderByDescending(x => x.DateEnd),
                ("DateEnd", false) => query.OrderBy(x => x.DateEnd),
                ("TotalAmount", true) => query.OrderByDescending(x => x.TotalAmount),
                ("TotalAmount", false) => query.OrderBy(x => x.TotalAmount),
                ("RoomName", true) => query.OrderByDescending(x => x.RoomName),
                ("RoomName", false) => query.OrderBy(x => x.RoomName),
                ("Status", true) => query.OrderByDescending(x => x.Status),
                ("Status", false) => query.OrderBy(x => x.Status),
                ("DateBooking", false) => query.OrderBy(x => x.DateBooking),
                _ => query.OrderByDescending(x => x.DateBooking)
            };
        }
    }
}
