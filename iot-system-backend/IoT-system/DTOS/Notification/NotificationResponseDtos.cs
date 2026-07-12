using IoT_system.Models;

namespace IoT_system.DTOS.Notification
{
    public class NotificationResponseDtos
    {
        public int Id { get; set; }

        public string Message { get; set; } = null!;

        public string Type { get; set; } = null!;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; }

    }
}
