using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Reviews
{
    public class ReviewGridPagingDto : PagingParams<ReviewGridDto>
    {
        public string? Keyword { get; set; }
        public int? BookingId { get; set; }
        public int? RoomId { get; set; }
        public int? CustomerId { get; set; }
        public decimal? Rating { get; set; }

        public override List<Expression<Func<ReviewGridDto, bool>>> GetPredicates()
        {
            var predicates = new List<Expression<Func<ReviewGridDto, bool>>>();

            if (BookingId.HasValue && BookingId.Value > 0)
            {
                var bookingId = BookingId.Value;
                predicates.Add(x => x.BookingId == bookingId);
            }

            if (RoomId.HasValue && RoomId.Value > 0)
            {
                var roomId = RoomId.Value;
                predicates.Add(x => x.RoomId == roomId);
            }

            if (CustomerId.HasValue && CustomerId.Value > 0)
            {
                var customerId = CustomerId.Value;
                predicates.Add(x => x.CustomerId == customerId);
            }

            if (Rating.HasValue && Rating.Value > 0)
            {
                var rating = Rating.Value;
                predicates.Add(x => x.Rating == rating);
            }

            if (!string.IsNullOrWhiteSpace(Keyword))
            {
                var keyword = Keyword.Trim();
                predicates.Add(x =>
                    x.CustomerName.Contains(keyword) ||
                    x.CustomerPhone.Contains(keyword) ||
                    x.RoomName.Contains(keyword) ||
                    x.Feedback.Contains(keyword));
            }

            return predicates;
        }
    }
}
