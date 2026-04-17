using System.ComponentModel.DataAnnotations;

namespace IoT_system.Configurations.jwt
{
    public class JwtOptions
    {
        [Required]
        [MinLength(32)]// key ít nhất 32 đảm bảo đủ mạnh ngay từ lần config
        public string Key { get; set; } = string.Empty;

        [Required]
        public string Issuer { get; set; } = string.Empty;

        [Required]
        public string Audience { get; set; } = string.Empty;

        [Range(1, 10080)]// tối đa 7day để dùng tài nguyên
        public int DurationInMinutes { get; set; }
    }
}
/* 
= string.Empty tức là key hiện tại sẽ có giá trị, nhưng hiện tại sẽ rỗng
tức khi khởi tạo, sau khi bind vào Bind từ appsettings.json nó mới ghi đè lại...
 */