using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Others
{
	public class ServiceGridPagingDto : PagingParams<ServiceGridDto>
	{
		public string? Keyword { get; set; }
		public int? ServiceTypeId { get; set; }

		public override List<Expression<Func<ServiceGridDto, bool>>> GetPredicates()
		{
			var predicates = new List<Expression<Func<ServiceGridDto, bool>>>();

			if (!string.IsNullOrWhiteSpace(Keyword))
			{
				var keyword = Keyword.Trim();
				predicates.Add(x =>
					x.NameService.Contains(keyword) ||
					x.ServiceCode.Contains(keyword) ||
					x.UnitName.Contains(keyword));
			}

			if (ServiceTypeId.HasValue)
			{
				predicates.Add(x => x.ServiceTypeId == ServiceTypeId);
			}

			return predicates;
		}
	}
}
