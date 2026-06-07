using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using DoAnWebQuanLyKhachSan.Data.Entities;
using DoAnWebQuanLyKhachSan.Service.Dtos.Reviews;
using DoAnWebQuanLyKhachSan.Utils.Common;
using DoAnWebQuanLyKhachSan.Utils.Service;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;

namespace DoAnWebQuanLyKhachSan.Service
{
    public class ReviewService
    {
        private readonly HotelManagementRepository _repository;
        private readonly BaseService _baseService;

        public ReviewService(HotelManagementRepository repository, IMapper mapper)
        {
            _repository = repository;
            _baseService = new BaseService(repository, mapper);
        }

        public async Task<PagingResult<ReviewGridDto>> GetReviews(ReviewGridPagingDto pagingModel)
        {
            pagingModel ??= new ReviewGridPagingDto();
            if (pagingModel.Page <= 0)
            {
                pagingModel.Page = 1;
            }

            if (pagingModel.ItemsPerPage <= 0)
            {
                pagingModel.ItemsPerPage = PagingParams<ReviewGridDto>.DefaultPageSize;
            }

            var query = BuildReviewGridQuery();
            var predicates = pagingModel.GetPredicates();
            if (predicates.Count > 0)
            {
                query = query.WhereMany(predicates.ToArray());
            }

            var totalRows = await query.CountAsync();
            var data = await query
                .OrderBy(pagingModel.SortExpression)
                .Skip(pagingModel.StartingIndex > 0 ? pagingModel.StartingIndex : 0)
                .Take(pagingModel.ItemsPerPage)
                .ToListAsync();

            return new PagingResult<ReviewGridDto>
            {
                CurrentPage = pagingModel.Page,
                PageSize = pagingModel.ItemsPerPage,
                TotalRows = totalRows,
                Data = data
            };
        }

        public async Task<ReviewDetailDto?> GetReviewById(int id)
        {
            return await BuildReviewDetailQuery()
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<int?> DeleteReview(int id)
        {
            var review = await GetDbContext().Reviews.FirstOrDefaultAsync(x => x.id == id);
            if (review == null)
            {
                return null;
            }

            await _baseService.DeleteAsync<Review, int>(id);
            return id;
        }

        private IQueryable<ReviewGridDto> BuildReviewGridQuery()
        {
            var db = GetDbContext();
            return from review in db.Reviews.AsNoTracking()
                   join booking in db.Bookings.AsNoTracking() on review.booking_id equals booking.id
                   join customerJoin in db.Customers.AsNoTracking() on booking.user_id equals customerJoin.userid into customerGroup
                   from customer in customerGroup.DefaultIfEmpty()
                   join roomJoin in db.Rooms.AsNoTracking() on booking.room_id equals roomJoin.id into roomGroup
                   from room in roomGroup.DefaultIfEmpty()
                   select new ReviewGridDto
                   {
                       Id = review.id,
                       BookingId = review.booking_id,
                       RoomId = booking.room_id ?? 0,
                       CustomerId = review.customer_id,
                       CustomerName = customer != null ? customer.fullname : string.Empty,
                       CustomerPhone = customer != null ? customer.phone ?? string.Empty : string.Empty,
                       RoomName = room != null ? room.room_name : string.Empty,
                       Rating = review.rating,
                       Feedback = review.feedback,
                       CreatedAt = review.created_at,
                       UpdatedAt = review.updated_at
                   };
        }

        private IQueryable<ReviewDetailDto> BuildReviewDetailQuery()
        {
            var db = GetDbContext();
            return from review in db.Reviews.AsNoTracking()
                   join booking in db.Bookings.AsNoTracking() on review.booking_id equals booking.id
                   join customerJoin in db.Customers.AsNoTracking() on booking.user_id equals customerJoin.userid into customerGroup
                   from customer in customerGroup.DefaultIfEmpty()
                   join roomJoin in db.Rooms.AsNoTracking() on booking.room_id equals roomJoin.id into roomGroup
                   from room in roomGroup.DefaultIfEmpty()
                   select new ReviewDetailDto
                   {
                       Id = review.id,
                       BookingId = review.booking_id,
                       CustomerId = review.customer_id,
                       CustomerName = customer != null ? customer.fullname : string.Empty,
                       CustomerPhone = customer != null ? customer.phone ?? string.Empty : string.Empty,
                       CustomerEmail = customer != null ? customer.mail ?? string.Empty : string.Empty,
                       RoomName = room != null ? room.room_name : string.Empty,
                       DateStart = booking.date_start,
                       DateEnd = booking.date_end,
                       Rating = review.rating,
                       Feedback = review.feedback,
                       CreatedAt = review.created_at,
                       UpdatedAt = review.updated_at
                   };
        }

        private HotelManagementContext GetDbContext()
        {
            return _repository.GetDbContext<HotelManagementContext>();
        }
    }
}
