using AutoMapper;
using IoT_system.DTOS.Common;
using IoT_system.DTOS.Notification;
using IoT_system.Helpers;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;

namespace IoT_system.Services.Notifications
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

       
        // ================= ADMIN =================

        public async Task<PagedResponseDtos<NotificationResponseDtos>>HistoryForAdmin(int page, int pageSize)
        {
            var notification = dbContext.Notifications.OrderByDescending(n => n.CreatedAt).AsNoTracking();

            return await PaginationHelper.GetPagedAsync<Notification, NotificationResponseDtos>(notification, page, pageSize, mapper);
        }

        // ================= USER =================

        public async Task<PagedResponseDtos<NotificationResponseDtos>>
            HistoryForUser(int userId, int page, int pageSize)
        {
            var notification = dbContext.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .AsNoTracking()
                .Where(n => n.UserId == userId);

            return await PaginationHelper.GetPagedAsync<Notification, NotificationResponseDtos>(notification, page, pageSize, mapper);
        }

        // xem chi tiết thông báo này gủi đến bao nhiêu user
        public async Task<NotificationDetailResponseDtos> HistoryDetail(int id)
        {
            var notification = await dbContext.Notifications
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.Id == id);

            if (notification == null){
                throw new KeyNotFoundException($"not found notification id = {id}");
            }

            var recipients = await dbContext.Notifications
                .Where(n => n.DeviceId == notification.DeviceId
                         && n.Message == notification.Message
                         && n.Type == notification.Type
                         && n.CreatedAt == notification.CreatedAt)
                .Include(n => n.User)
                .AsNoTracking()
                .Select(n => new NotificationRecipientDto
                {
                    NotificationId = n.Id,
                    Fullname = n.User.Fullname,
                    IsRead = n.IsRead,
                    UserId = n.UserId
                })
                .ToListAsync();

            var result = mapper.Map<NotificationDetailResponseDtos>(notification);
            result.Users = recipients;
            return result;
        }

        public async Task<PagedResponseDtos<NotificationResponseDtos>> SearchHistory(DateTime? fromDate, DateTime? toDate, bool? isRead, string? type, int page, int pageSize)
        {
            var query = dbContext.Notifications.AsNoTracking().AsQueryable();

            if (fromDate.HasValue)
            {
                query = query.Where(x => x.CreatedAt >= fromDate.Value.Date);
            }

            if (toDate.HasValue)
            {
                query = query.Where(x => x.CreatedAt < toDate.Value.Date.AddDays(1));
            }

            if (isRead.HasValue)
            {
                query = query.Where(x => x.IsRead == isRead);
            }

            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(x => x.Type == type);
            }

            query = query.OrderByDescending(n => n.CreatedAt);

            return await PaginationHelper.GetPagedAsync<Notification, NotificationResponseDtos>(query, page, pageSize, mapper);
        }

    }
}

