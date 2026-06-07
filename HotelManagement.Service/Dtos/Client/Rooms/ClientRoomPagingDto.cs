using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Client.Rooms
{
	public class ClientRoomPagingDto : PagingParams<ClientRoomDto>
	{
		public string? Keyword { get; set; }
		public string? RoomTypeId { get; set; }
		public decimal? MinPrice { get; set; }
		public decimal? MaxPrice { get; set; }
		public DateTime? DateStart { get; set; }
		public DateTime? DateEnd { get; set; }
		public bool OnlyAvailable { get; set; } = true;

		public override List<Expression<Func<ClientRoomDto, bool>>> GetPredicates()
		{
			var predicates = new List<Expression<Func<ClientRoomDto, bool>>>();

			if (!string.IsNullOrWhiteSpace(Keyword))
			{
				var keyword = Keyword.Trim();
				predicates.Add(x =>
					x.RoomName.Contains(keyword) ||
					x.RoomTypeName.Contains(keyword));
			}

			if (!string.IsNullOrWhiteSpace(RoomTypeId))
			{
				var roomTypeId = RoomTypeId.Trim();
				predicates.Add(x => x.RoomTypeId == roomTypeId);
			}

			if (MinPrice.HasValue)
			{
				var minPrice = MinPrice.Value;
				predicates.Add(x => x.Price.HasValue && x.Price.Value >= minPrice);
			}

			if (MaxPrice.HasValue)
			{
				var maxPrice = MaxPrice.Value;
				predicates.Add(x => x.Price.HasValue && x.Price.Value <= maxPrice);
			}

			if (DateStart.HasValue && DateEnd.HasValue && OnlyAvailable)
			{
				predicates.Add(x => x.IsAvailable);
			}

			return predicates;
		}
	}
}
