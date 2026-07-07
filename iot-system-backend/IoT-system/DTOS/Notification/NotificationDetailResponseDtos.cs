using IoT_system.Models;

namespace IoT_system.DTOS.Notification
{
    public class NotificationDetailResponseDtos
    {
        public int Id { get; set; }
        public int DeviceId { get; set; }
        public string Message { get; set; } = null!;
        public string Type { get; set; } = null!;
        public bool IsRead { get; set; } // get ra user nào chưa xác nhận cảnh báo
        public DateTime CreatedAt { get; set; }
        public List<NotificationRecipientDto> Users { get; set; } = new();
    }
    public class NotificationRecipientDto
    {
        public int NotificationId { get; set; } // để FE biết click vào row nào
        public int UserId { get; set; }
        public string Fullname { get; set; } = null!;
        public bool IsRead { get; set; }
    }
}