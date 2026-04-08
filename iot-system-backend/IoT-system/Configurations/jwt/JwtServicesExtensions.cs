using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace IoT_system.Configurations.jwt
{
    public static class JwtServicesExtensions
    {
        // =============> cấu hình authen midleware
        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration) {
            // tạo 1 form jwtOption
            var jwtOptions = new jwt.JwtOptions();

            // bind 
            configuration.GetSection("Jwt").Bind(jwtOptions);

            // đăng ký services trong đây luôn, ko tách trong program vì gom chung jwt
            //services.AddScoped<>();
            // chuyển chuỗi khóa bí mật thành mảng byte để dùng tạo và xác thực token ( vì thuật toán mã hóa HMAC-SHA256 hiểu byte, ko hiểu chữ)
            var key = Encoding.UTF8.GetBytes(jwtOptions.Key);
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(option => { // AddAuthentication app có verify

                // --------- đọc token từ cookie do đang cấu hình token gửi kèm trong cookie ----------
                option.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies["access_token"];
                        return Task.CompletedTask;
                    }
                };

                option.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true, // xác thực token phải do nhà phát hành hợp lệ không, nếu ko có thì token app nào cũng hợp lệ
                    ValidateAudience = true, // Kiểm tra token dùng cho app nào, nếu ko có thì Token của client A dùng được cho client B
                    ValidateLifetime = true, // Kiểm tra token còn hạn không, nếu ko có thì Token hết hạn vẫn dùng được mãi mãi
                    ValidateIssuerSigningKey = true, // Kiểm tra chữ ký có hợp lệ không, nếu ko có thi Token giả mạo lọt vào

                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(key),

                    ClockSkew = TimeSpan.Zero // Mặc định .NET cho phép lệch 5 phút, nếu ko có token hết hạn vẫn dùng thêm 5 phút
                                              // trên là cấu hình khi nhận token từ client, sẽ làm gì...
                };
            });

            services.AddAuthorization();
            return services;
        }
    }
}
