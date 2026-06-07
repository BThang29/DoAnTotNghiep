using DoAnWebQuanLyKhachSan.Utils.Service;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Payments
{
	public class PaymentGridPagingDto : PagingParams<PaymentGridDto>
	{
		public string? Keyword { get; set; }
		public string? Method { get; set; }

		public override List<Expression<Func<PaymentGridDto, bool>>> GetPredicates()
		{
			var predicates = new List<Expression<Func<PaymentGridDto, bool>>>();

			if (!string.IsNullOrWhiteSpace(Method))
			{
				var method = Method.Trim();
				predicates.Add(x => x.Method == method);
			}

			if (!string.IsNullOrWhiteSpace(Keyword))
			{
				var keyword = Keyword.Trim();
				predicates.Add(x =>
					x.Method.Contains(keyword) ||
					x.AccountName.Contains(keyword) ||
					x.AccountNumber.Contains(keyword) ||
					x.BankName.Contains(keyword) ||
					x.Note.Contains(keyword));
			}

			return predicates;
		}
	}
}
