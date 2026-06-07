using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Client.Reviews;
using DoAnWebQuanLyKhachSan.Service.Dtos.Reviews;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;

namespace DoAnWebQuanLyKhachSan.Service
{
    public class ClientReviewService
    {
        private readonly HotelManagementRepository _repository;
        private readonly BaseService _baseService;

        public ClientReviewService(HotelManagementRepository repository, IMapper mapper)
        {
            _repository = repository;
            _baseService = new BaseService(repository, mapper);
        }

        public async Task<int?> SubmitReview(ClientReviewCreateDto model)
        {
            var booking = await GetDbContext().ClientBookingHistoryViews
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.BookingId == model.BookingId);
            if (booking == null)
            {
                return null;
            }

            if (string.Equals(booking.Status, "Upcoming", StringComparison.OrdinalIgnoreCase)
                || string.Equals(booking.Status, "Ongoing", StringComparison.OrdinalIgnoreCase))
            {
                return -2;
            }

            if (model.CustomerId.HasValue && booking.CustomerId != model.CustomerId.Value)
            {
                return -3;
            }

            if (!string.IsNullOrWhiteSpace(model.Phone))
            {
                if (!string.Equals(booking.CustomerPhone, model.Phone.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    return -3;
                }
            }

            var review = await GetDbContext().Reviews.FirstOrDefaultAsync(x => x.booking_id == model.BookingId);
            if (review == null)
            {
                review = new Review
                {
                    booking_id = booking.BookingId,
                    customer_id = booking.CustomerId,
                    rating = model.Rating,
                    feedback = model.Feedback.Trim(),
                    created_at = DateTime.UtcNow
                };

                GetDbContext().Reviews.Add(review);
            }
            else
            {
                review.customer_id = booking.CustomerId;
                review.rating = model.Rating;
                review.feedback = model.Feedback.Trim();
                review.updated_at = DateTime.UtcNow;
            }

            await GetDbContext().SaveChangesAsync();
            return review.id;
        }

        public async Task<ClientReviewResultDto?> GetReviewResult(int reviewId)
        {
            return await _baseService.FindAsync<Review, ClientReviewResultDto>(x => x.ReviewId == reviewId);
        }

        public async Task<List<ReviewGridDto>> GetReviewsByRoom(int roomId, int take = 10)
        {
            if (roomId <= 0)
            {
                return new List<ReviewGridDto>();
            }

            var pageSize = take > 0 ? take : 10;
            var db = GetDbContext();

            return await (from review in db.Reviews.AsNoTracking()
                          join booking in db.Bookings.AsNoTracking() on review.booking_id equals booking.id
                          join customerJoin in db.Customers.AsNoTracking() on booking.user_id equals customerJoin.userid into customerGroup
                          from customer in customerGroup.DefaultIfEmpty()
                          join roomJoin in db.Rooms.AsNoTracking() on booking.room_id equals roomJoin.id into roomGroup
                          from room in roomGroup.DefaultIfEmpty()
                          where booking.room_id == roomId
                          orderby review.created_at descending
                          select new ReviewGridDto
                          {
                              Id = review.id,
                              BookingId = review.booking_id,
                              CustomerId = review.customer_id,
                              CustomerName = customer != null ? customer.fullname : string.Empty,
                              CustomerPhone = customer != null ? customer.phone ?? string.Empty : string.Empty,
                              RoomName = room != null ? room.room_name : string.Empty,
                              Rating = review.rating,
                              Feedback = review.feedback,
                              CreatedAt = review.created_at,
                              UpdatedAt = review.updated_at
                          })
                .Take(pageSize)
                .ToListAsync();
        }

        private HotelManagementContext GetDbContext()
        {
            return _repository.GetDbContext<HotelManagementContext>();
        }
    }
}
