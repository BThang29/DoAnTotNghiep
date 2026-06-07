using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Invoices
{
	public class InvoiceGridPagingDto : PagingParams<InvoiceGridDto>
	{
		public string? Keyword { get; set; }
		public int? BookingId { get; set; }

		public override List<Expression<Func<InvoiceGridDto, bool>>> GetPredicates()
		{
			var predicates = new List<Expression<Func<InvoiceGridDto, bool>>>();

			if (BookingId.HasValue)
			{
				predicates.Add(x => x.BookingId == BookingId);
			}

			if (!string.IsNullOrWhiteSpace(Keyword))
			{
				var keyword = Keyword.Trim();
				predicates.Add(x =>
					x.CustomerName.Contains(keyword) ||
					x.RoomName.Contains(keyword) ||
					x.EmployeeName.Contains(keyword));
			}

			return predicates;
		}
	}
}
