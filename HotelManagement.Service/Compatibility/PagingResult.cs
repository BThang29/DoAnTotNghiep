using System.Collections.Generic;

namespace DoAnWebQuanLyKhachSan.Utils.Service
{
	public class PagingResult<TDto>
	{
		public int PageSize { get; set; }
		public int CurrentPage { get; set; }
		public int TotalRows { get; set; }
		public IList<TDto> Data { get; set; } = new List<TDto>();
	}
}
