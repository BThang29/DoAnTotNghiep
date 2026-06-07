using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Bookings
{
	public class AvailableRoomPagingDto : PagingParams<AvailableRoomDto>
	{
		public AvailableRoomPagingDto()
		{
			Page = 1;
			ItemsPerPage = 6;
			SortBy = nameof(AvailableRoomDto.Price);
		}

		public DateTime DateStart { get; set; }
		public DateTime DateEnd { get; set; }
		public string? RoomTypeId { get; set; }

		public void NormalizeSort()
		{
			SortBy = string.Equals(SortBy, nameof(AvailableRoomDto.Price), StringComparison.OrdinalIgnoreCase)
				? nameof(AvailableRoomDto.Price)
				: nameof(AvailableRoomDto.RoomId);
		}

		public override List<Expression<Func<AvailableRoomDto, bool>>> GetPredicates()
		{
			var predicates = new List<Expression<Func<AvailableRoomDto, bool>>>();

			if (!string.IsNullOrWhiteSpace(RoomTypeId))
			{
				var roomTypeId = RoomTypeId.Trim();
				predicates.Add(x => x.RoomTypeId == roomTypeId);
			}

			return predicates;
		}
	}
}
