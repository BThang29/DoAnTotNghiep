using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Bookings
{
	public class BookingGridPagingDto : PagingParams<BookingGridDto>
	{
		public string? Keyword { get; set; }
		public int? RoomId { get; set; }
		public int? CustomerId { get; set; }

		public override List<Expression<Func<BookingGridDto, bool>>> GetPredicates()
		{
			var predicates = new List<Expression<Func<BookingGridDto, bool>>>();

			if (CustomerId.HasValue)
			{
				predicates.Add(x => x.CustomerId == CustomerId);
			}

			if (RoomId.HasValue)
			{
				predicates.Add(x => x.RoomId == RoomId);
			}

			if (!string.IsNullOrWhiteSpace(Keyword))
			{
				var keyword = Keyword.Trim();
				predicates.Add(x => x.CustomerName.Contains(keyword) || x.RoomName.Contains(keyword));
			}

			return predicates;
		}
	}
}
