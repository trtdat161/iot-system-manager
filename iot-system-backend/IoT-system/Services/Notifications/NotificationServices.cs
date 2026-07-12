using IoT_system.DTOS.Common;
using IoT_system.DTOS.Notification;

namespace IoT_system.Services.Notifications
{
    public interface NotificationServices
    {
        public Task<PagedResponseDtos<NotificationResponseDtos>> HistoryForAdmin(int page, int pageSize);
        public Task<NotificationDetailResponseDtos> HistoryDetail(int id);
        public Task<PagedResponseDtos<NotificationResponseDtos>> HistoryForUser(int userId, int page, int pageSize);
        public Task<PagedResponseDtos<NotificationResponseDtos>> SearchHistory(DateTime? fromDate, DateTime? toDate, bool? isRead, string? type, int page, int pageSize);
    }
}