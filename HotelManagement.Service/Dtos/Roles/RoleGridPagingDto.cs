using DoAnWebQuanLyKhachSan.Utils.Service;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace DoAnWebQuanLyKhachSan.Service.Dtos.Roles
{
	public class RoleGridPagingDto : PagingParams<RoleGridDto>
	{
		public string? Keyword { get; set; }

		public override List<Expression<Func<RoleGridDto, bool>>> GetPredicates()
		{
			if (string.IsNullOrWhiteSpace(Keyword))
			{
				return new List<Expression<Func<RoleGridDto, bool>>>();
			}

			return new List<Expression<Func<RoleGridDto, bool>>>
			{
				x => x.Name.Contains(Keyword) || x.Description.Contains(Keyword)
			};
		}
	}
}
