using AutoMapper;
using IoT_system.DTOS.Common;
using IoT_system.DTOS.Notification;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;

namespace IoT_system.Services.Notification
{
    public class NotificationServicesImpl : NotificationServices
    {
        private readonly DatabaseContext dbContext;
        private readonly IMapper mapper;

        public NotificationServicesImpl(
            DatabaseContext _dbContext,
            IMapper _mapper)
        {
            dbContext = _dbContext;
            mapper = _mapper;
        }

        // ================= PRIVATE COMMON METHOD =================

        private async Task<PagedResponseDtos<TDto>> GetPagedNotifications<TDto>(
            IQueryable<Models.Notification> query,
            int page,
            int pageSize)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 || pageSize > 100
                ? 10
                : pageSize;

            var totalItems = await query.CountAsync();

            var notifications = await query
                .OrderBy(n => n.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResponseDtos<TDto>
            {
                Data = mapper.Map<List<TDto>>(notifications),
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            };
        }

        // ================= ADMIN =================

        public Task<PagedResponseDtos<NotificationAdminResponseDtos>>
            HistoryForAdmin(int page, int pageSize)
        {
            var query = dbContext.Notifications
                .AsNoTracking();

            return GetPagedNotifications<NotificationAdminResponseDtos>(
                query,
                page,
                pageSize);
        }

        // ================= USER =================

        public Task<PagedResponseDtos<NotificationUserResponseDtos>>
            HistoryForUser(int userId, int page, int pageSize)
        {
            var query = dbContext.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId);

            return GetPagedNotifications<NotificationUserResponseDtos>(
                query,
                page,
                pageSize);
        }

        // xem chi tiết thông báo này gủi đến bao nhiêu user
        public async Task<NotificationDetailResponseDtos> HistoryDetail(int id)
        {
            var notificationDetail = await dbContext.Notifications.Where(n => n.Id == id)
                                                                  .Include(n => n.User)// include load luôn bảng liên quan
                                                                  .AsNoTracking()
                                                                  .FirstOrDefaultAsync();
            return mapper.Map<NotificationDetailResponseDtos>(notificationDetail);
        }

    }
}