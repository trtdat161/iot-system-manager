namespace IoT_system.DTOS.Notification
{
    public class NotificationDetailResponseDtos
    {
        public int Id { get; set; }
        public int DeviceId { get; set; }
        public int UserId { get; set; }
        public string Message { get; set; } = null!;
        public string Type { get; set; } = null!;
        public bool IsRead { get; set; } // get ra user nào chưa xác nhận cảnh báo
        public DateTime CreatedAt { get; set; }
    }
}