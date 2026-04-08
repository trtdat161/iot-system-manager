using IoT_system.Configurations.jwt;
using IoT_system.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CaiderProject.Authen
{
    public class JwtTokenServices
    {
        private readonly JwtOptions _options;

        public JwtTokenServices(JwtOptions options)
        {
            _options = options;// _options = dữ liệu từ appsettings.json
        }
        /*
        - Nhận Account (user)
        - Tạo thông tin (claims)
        - Ký token bằng key bí mật
        - Trả về chuỗi JWT
        */
        public string GenerateToken(Account account)// nhận paramoter từ account trả về jwt...
        {
            var claims = new[]// nhét data vào tokenx
            {
                new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
                new Claim(ClaimTypes.Email, account.Email),
                new Claim(ClaimTypes.Name, account.Fullname),
                new Claim(ClaimTypes.Role, account.Role)
            };

            // tạo mã khoá bí mật và convert sang byte vì thuật toán mã hóa chỉ hiểu byte
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_options.Key)
            );

            // tạo chữ ký chống giả mạo token
            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            // đây là  bước tạo (LẮP RAP TOKEN)
            var token = new JwtSecurityToken(
                issuer: _options.Issuer,// ai phát hành token
                audience: _options.Audience,// token dùng cho app nào
                claims: claims,// DATA user
                expires: DateTime.UtcNow.AddMinutes(_options.DurationInMinutes),// thời gian hết hạn dùng UTC để tránh lệch giờ
                signingCredentials: creds// chữ ký đã tạo ở trên
            );

            return new JwtSecurityTokenHandler().WriteToken(token);// Convert token -> string vì token hiện là object C# HTTP chỉ gửi được string             
          
        }
    }
}
