using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Customers
{
	public class CustomerGridPagingDto : PagingParams<CustomerGridDto>
	{
		public string? Keyword { get; set; }
		public int? CustomerTypeId { get; set; }

		public override List<Expression<Func<CustomerGridDto, bool>>> GetPredicates()
		{
			var predicates = new List<Expression<Func<CustomerGridDto, bool>>>();

			if (!string.IsNullOrWhiteSpace(Keyword))
			{
				var keyword = Keyword.Trim();
				predicates.Add(x =>
					x.FullName.Contains(keyword) ||
					x.Identify.Contains(keyword) ||
					x.Phone.Contains(keyword) ||
					x.Mail.Contains(keyword));
			}

			if (CustomerTypeId.HasValue)
			{
				predicates.Add(x => x.CustomerTypeId == CustomerTypeId);
			}

			return predicates;
		}
	}
}
