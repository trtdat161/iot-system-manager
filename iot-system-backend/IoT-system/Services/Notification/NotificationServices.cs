using IoT_system.DTOS.Common;
using IoT_system.DTOS.Notification;

namespace IoT_system.Services.Notification
{
    public interface NotificationServices
    {
        public Task<PagedResponseDtos<NotificationAdminResponseDtos>> HistoryForAdmin(int page, int pageSize);

        public Task<PagedResponseDtos<NotificationUserResponseDtos>> HistoryForUser(int userId, int page, int pageSize);
    }
}