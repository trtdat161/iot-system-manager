namespace IoT_system.Configurations.jwt
{
    public class JwtOptions
    {
        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int DurationInMinutes { get; set; }
    }
}
/* 
= string.Empty tức là key hiện tại sẽ có giá trị, nhưng hiện tại sẽ rỗng
tức khi khởi tạo, sau khi bind vào Bind từ appsettings.json nó mới ghi đè lại...
 */