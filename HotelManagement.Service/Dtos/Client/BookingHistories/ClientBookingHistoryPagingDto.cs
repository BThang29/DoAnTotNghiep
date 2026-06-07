using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.BookingHistories
{
	public class ClientBookingHistoryPagingDto : PagingParams<ClientBookingHistoryDto>
    {
		public string? Keyword { get; set; }
		public int? UserId { get; set; }
		public string? Phone { get; set; }

        public override List<Expression<Func<ClientBookingHistoryDto, bool>>> GetPredicates()
        {
            var predicates = new List<Expression<Func<ClientBookingHistoryDto, bool>>>();

            if (UserId.HasValue)
            {
                var userId = UserId.Value;
                predicates.Add(x => x.UserId == userId);
            }

            if (!string.IsNullOrWhiteSpace(Phone))
            {
                var phone = Phone.Trim();
                predicates.Add(x => x.CustomerPhone == phone);
            }

            if (!string.IsNullOrWhiteSpace(Keyword))
            {
                var keyword = Keyword.Trim();
                predicates.Add(x =>
                    x.CustomerName.Contains(keyword) ||
                    x.CustomerPhone.Contains(keyword) ||
                    x.CustomerMail.Contains(keyword) ||
                    x.RoomName.Contains(keyword) ||
                    x.Status.Contains(keyword) ||
                    x.Feedback.Contains(keyword));
            }

            return predicates;
        }
    }
}
