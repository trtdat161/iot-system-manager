// File: Helpers/PagingHelper.cs
using AutoMapper;
using IoT_system.DTOS.Common;
using Microsoft.EntityFrameworkCore;

namespace IoT_system.Helpers
{
    public static class PaginationHelper
    {
        public static async Task<PagedResponseDtos<TDto>> GetPagedAsync<TEntity, TDto>(
            IQueryable<TEntity> query,
            int page,
            int pageSize,
            IMapper mapper)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 || pageSize > 100 ? 10 : pageSize;

            var totalItems = await query.CountAsync();

            var entities = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResponseDtos<TDto>
            {
                Data = mapper.Map<List<TDto>>(entities),
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            };
        }
    }
}