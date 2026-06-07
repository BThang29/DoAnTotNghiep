using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Rooms
{
	public class RoomGridPagingDto : PagingParams<RoomGridDto>
	{
		public string? Keyword { get; set; }
		public string? RoomTypeId { get; set; }
		public string? RoomStatusId { get; set; }

		public override List<Expression<Func<RoomGridDto, bool>>> GetPredicates()
		{
			var predicates = new List<Expression<Func<RoomGridDto, bool>>>();

			if (!string.IsNullOrWhiteSpace(Keyword))
			{
				var keyword = Keyword.Trim();
				predicates.Add(x => x.RoomName.Contains(keyword));
			}

			if (!string.IsNullOrWhiteSpace(RoomTypeId))
			{
				predicates.Add(x => x.RoomTypeId == RoomTypeId);
			}

			if (!string.IsNullOrWhiteSpace(RoomStatusId))
			{
				predicates.Add(x => x.RoomStatusId == RoomStatusId);
			}

			return predicates;
		}
	}
}
