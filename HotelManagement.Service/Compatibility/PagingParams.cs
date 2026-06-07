using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Utils.Service
{
	public class PagingParams<TDto>
	{
		public int ItemsPerPage { get; set; } = 20;
		public int Page { get; set; } = 1;
		public string? SortExpression { get; set; }
		public int StartingIndex { get; set; }

		public virtual IEnumerable<Expression<Func<TDto, bool>>> GetPredicates()
		{
			return Array.Empty<Expression<Func<TDto, bool>>>();
		}
	}
}
