namespace IoT_system.DTOS.Mail
{
    public class EmailSettings
    {
        public string Host { get; set; } = "smtp.gmail.com";
        public int Port { get; set; } = 587;
        public string SenderName { get; set; } = "IoT System";
        public string SenderEmail { get; set; } = "";
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
/*
 EmailSettings.cs là class đại diện cho phần cấu hình. Khi app chạy, 
 .NET tự đổ giá trị từ appsettings.json và secrets.json vào đây.
 */
