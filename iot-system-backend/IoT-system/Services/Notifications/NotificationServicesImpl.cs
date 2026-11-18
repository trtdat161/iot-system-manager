using AutoMapper;
using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Common;
using IoT_system.DTOS.Notification;
using IoT_system.Helpers;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.NetworkInformation;
using static Microsoft.Extensions.Logging.EventSource.LoggingEventSource;

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
            var notifications = dbContext.Notifications.AsNoTracking();
            return await GetAdminHistoryPage(notifications, page, pageSize);
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
            result.IsRead = recipients.All(recipient => recipient.IsRead);
            return result;
        }

        public async Task<PagedResponseDtos<NotificationResponseDtos>> SearchHistory(DateTime? fromDate, DateTime? toDate, bool? isRead, string? type, int page, int pageSize, int? userId = null)
        {
            var query = dbContext.Notifications.AsNoTracking().AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(x => x.UserId == userId.Value);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(x => x.CreatedAt >= fromDate.Value.Date);
            }

            if (toDate.HasValue)
            {
                query = query.Where(x => x.CreatedAt < toDate.Value.Date.AddDays(1));
            }

            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(x => x.Type == type);
            }

            query = query.OrderByDescending(n => n.CreatedAt);

            if (!userId.HasValue)
            {
                return await GetAdminHistoryPage(query, page, pageSize, isRead);
            }

            if (isRead.HasValue)
            {
                query = query.Where(x => x.IsRead == isRead.Value);
            }

            return await PaginationHelper.GetPagedAsync<Notification, NotificationResponseDtos>(query, page, pageSize, mapper);
        }

        private async Task<PagedResponseDtos<NotificationResponseDtos>> GetAdminHistoryPage(
            IQueryable<Notification> query,
            int page,
            int pageSize,
            bool? isRead = null)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 || pageSize > 100 ? 10 : pageSize;

            var groupedNotifications = query
                .GroupBy(notification => new
                {
                    notification.DeviceId,
                    notification.Message,
                    notification.Type,
                    notification.CreatedAt
                })
                .Select(group => new
                {
                    Id = group.Min(notification => notification.Id),
                    LatestId = group.Max(notification => notification.Id),
                    group.Key.DeviceId,
                    group.Key.Message,
                    group.Key.Type,
                    group.Key.CreatedAt,
                    IsRead = group.All(notification => notification.IsRead),
                    HasUnreadRecipient = group.Any(notification => !notification.IsRead),
                    AlertCount = group.Max(notification => notification.AlertCount)
                });

            if (isRead.HasValue)
            {
                groupedNotifications = groupedNotifications
                    .Where(notification => notification.IsRead == isRead.Value);
            }

            var totalItems = await groupedNotifications.CountAsync();
            var data = await groupedNotifications
                .OrderByDescending(notification => notification.CreatedAt)
                .ThenByDescending(notification => notification.LatestId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(notification => new NotificationResponseDtos
                {
                    Id = notification.Id,
                    Message = notification.Message,
                    Type = notification.Type,
                    DeviceId = notification.DeviceId,
                    IsRead = notification.IsRead,
                    HasUnreadRecipient = notification.HasUnreadRecipient,
                    AlertCount = notification.AlertCount,
                    CreatedAt = notification.CreatedAt
                })
                .ToListAsync();

            return new PagedResponseDtos<NotificationResponseDtos>
            {
                Data = data,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            };
        }

        // khi click ấn đã xem để thiết bị không spam cảnh báo nữa
        public async Task<NotificationIsreadResponseDtos> IsReadAction(int notificationId, int userId)
        {
            var notification = await dbContext.Notifications
                                              .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            if (notification == null)
            {
                throw new BadHttpRequestException("not found notifications");
            }

            notification.IsRead = true;// khi ng dùng ấn xác nhận thì là true, device ko spam nữa
            await dbContext.SaveChangesAsync();
            return mapper.Map<NotificationIsreadResponseDtos>(notification);

        }
    }
}
