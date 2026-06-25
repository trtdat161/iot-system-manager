namespace IoT_system.DTOS.Notification
{
    public class NotificationAdminResponseDtos
    {
        public int Id { get; set; }
        public string Message { get; set; } = null!;
        public string Type { get; set; } = null!;
        public bool IsRead { get; set; } // get ra user nào chưa xác nhận cảnh báo
        public DateTime CreatedAt { get; set; }
    }
}