using System.Linq;

namespace DoAnWebQuanLyKhachSan.Data
{
	public class HotelManagementRepository
	{
		public virtual IQueryable<TEntity> Filter<TEntity>() where TEntity : class
		{
			return Enumerable.Empty<TEntity>().AsQueryable();
		}

		public virtual IQueryable<TEntity> All<TEntity>() where TEntity : class
		{
			return Enumerable.Empty<TEntity>().AsQueryable();
		}
	}
}
