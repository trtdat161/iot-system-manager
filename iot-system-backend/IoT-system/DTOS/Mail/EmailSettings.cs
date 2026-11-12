namespace IoT_system.DTOS.Mail
{
    public class EmailSettings
    {
        public string Host { get; set; } = "smtp.gmail.com"; // địa chỉ gửi mail của Gmail (smtp.gmail.com, cổng 587).
        public int Port { get; set; } = 587;
        public string SenderName { get; set; } = "DTECH IoT";
        public string SenderEmail { get; set; } = "";
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
/*
 EmailSettings.cs là class đại diện cho phần cấu hình. Khi app chạy, 
 .NET tự đổ giá trị từ appsettings.json và secrets.json vào đây.
 */
