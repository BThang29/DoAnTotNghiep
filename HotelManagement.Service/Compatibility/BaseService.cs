using AutoMapper;
using DoAnWebQuanLyKhachSan.Data;
using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace DoAnWebQuanLyKhachSan.Utils.Service
{
	public abstract class BaseService
	{
		protected readonly HotelManagementRepository _repository;
		protected readonly IMapper _mapper;

		protected BaseService(HotelManagementRepository repository, IMapper mapper)
		{
			_repository = repository;
			_mapper = mapper;
		}

		public abstract PagingResult<TDto> FilterPaged<TEntity, TDto>(PagingParams<TDto> pagingParams, params Expression<Func<TDto, bool>>[] predicates)
			where TEntity : class;

		public abstract PagingResult<TDto> FilterPaged<TEntity, TDto>(Expression<Func<TEntity, TDto>> mapping, PagingParams<TDto> pagingParams, params Expression<Func<TDto, bool>>[] predicates)
			where TEntity : class;

		public abstract Task<PagingResult<TDto>> FilterPagedAsync<TEntity, TDto>(PagingParams<TDto> pagingParams, params Expression<Func<TDto, bool>>[] predicates)
			where TEntity : class;

		public abstract Task<PagingResult<TDto>> FilterPagedAsync<TEntity, TDto>(Expression<Func<TEntity, TDto>> mapping, PagingParams<TDto> pagingParams, params Expression<Func<TDto, bool>>[] predicates)
			where TEntity : class;
	}
}
