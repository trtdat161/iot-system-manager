using CaiderProject.Authen;
using IoT_system.Configurations.jwt;
using IoT_system.DTOS;
using IoT_system.Models;
using Mapster;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text.RegularExpressions;

namespace IoT_system.Services
{
    public class AccountServicesImpl : AccountServices
    {
        private readonly DatabaseContext dbContext;
        private readonly JwtTokenServices jwtTokenServices;
        private readonly IHttpContextAccessor httpContextAccessor; //IHttpContextAccessor
        private readonly JwtOptions options;

        public AccountServicesImpl(
            DatabaseContext _dbContext, 
            JwtTokenServices _jwtTokenServices, 
            IHttpContextAccessor _httpContextAccessor, 
            IOptions<JwtOptions> _options) // IOptions
        {
            dbContext = _dbContext;
            jwtTokenServices = _jwtTokenServices;
            httpContextAccessor = _httpContextAccessor;
            options = _options.Value;// có IOptions thêm .Value
        }
        // ------------------ register ------------------
        public async Task<IResult> Register(AccountRegisterDtos dto)// dto parameter
        {
            try
            {
                // fullname
                if (string.IsNullOrWhiteSpace(dto.Fullname))
                {
                    throw new Exception("tên không được để trống !");
                }

                // email
                if (string.IsNullOrWhiteSpace(dto.Email))
                {
                    throw new Exception("email không được để trống !");
                }
                if (!Regex.IsMatch(dto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    throw new Exception("email không hợp lệ !");
                }
                if(await dbContext.Accounts.AnyAsync(acc => acc.Email == dto.Email))// check email unique
                {
                    throw new Exception("email này đã tồn tại !");
                }

                // password
                if (string.IsNullOrWhiteSpace(dto.Password)) { 
                    throw new Exception("không để trống passowrd !");
                }
                if(!Regex.IsMatch(dto.Password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$"))
                {
                    throw new Exception("mật khẩu ít nhất 6 ký tự, 1 chữ hoa, 1 chữ thường và 1 chữ số !");
                }

                // cho user chọn ngôn ngữ khi đăng ký
                if(!await dbContext.Languages.AnyAsync(l => l.Id == dto.LanguageId))
                {
                    throw new Exception("select your language !");
                }

                // Map DTO -> Entity thì adap sẽ tự đông map các cái như fullname và email,...
                var account = dto.Adapt<Account>();// dto
                account.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
                // set override value default
                account.Role = "user";
                account.Status = true;
                account.CreatedAt = DateTime.UtcNow;

                // save db
                dbContext.Accounts.Add(account);
                await dbContext.SaveChangesAsync(); // insert thật vào db

                // map đến AccountResponseDtos
                var accountDto = account.Adapt<AccountResponseDtos>();// trả client sau khi regidter để có thể get ra các info user
                return Results.Ok(accountDto);
                /* ---- trả về dto với các field sạch thay vì trả về account chứa các field nhạy cảm,... ---- */

            }
            catch (Exception ex) {
                throw new Exception("error :"+ ex.Message);
            }
        }

        // ------------------ login ------------------
        public async Task<IResult> Login(AccountLoginDtos dto)
        {
            try
            {
                // email login
                if (string.IsNullOrWhiteSpace(dto.Email))
                {
                    throw new Exception("email không được để trống !");
                }
                if(!Regex.IsMatch(dto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    throw new Exception("email không hợp lệ !");
                }
                // ko check email đã tồn tại vì nếu làm vậy sẽ ko bao h login đc

                // password
                if (string.IsNullOrWhiteSpace(dto.Password))
                {
                    throw new Exception("không để trống passowrd !");
                }
                // ko check Regex vì nếu lỡ đủ patern nhưng sai pass thì cũng đi luôn nên chỉ check password rỗng

                // check
                var account = await dbContext.Accounts.FirstOrDefaultAsync(acc => acc.Email == dto.Email && acc.Status == true);
                if (account == null)
                {
                    throw new Exception("sai email hoặc mật khẩu !");
                }

                bool isValid = BCrypt.Net.BCrypt.Verify(dto.Password, account.Password);
                if (!isValid)
                {
                    throw new Exception("sai email hoặc mật khẩu !");
                }
                
                // -> nếu ok chạy đc đến đây thì thực hiện tiếp
                var token = jwtTokenServices.GenerateToken(account);

                httpContextAccessor.HttpContext!.Response.Cookies.Append("access_token", token, new CookieOptions { 
                    HttpOnly = true,
                    Secure = false, // false khi dev test local
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddMinutes(options.DurationInMinutes),// lấy time là 15 trùng vs bên kia
                    Path = "/"
                });

                // done
                return Results.Ok(new
                {
                    Msg_login = "login done"
                });
            }
            catch(Exception ex)
            {
                throw new Exception("error :" + ex.Message);
            }
        }

        // logout 
        public IResult Logout()
        {
            try
            {
                httpContextAccessor.HttpContext!.Response.Cookies.Delete("access_token", new CookieOptions
                {
                    /*
                     HttpOnly, Secure, SameSite, Expires — 
                     những cái này là thuộc tính bảo mật của cookie, chỉ có ý nghĩa khi tạo cookie
                     nên khi logout và xoá thì ko cần gọi lại các thuộc tính trên
                     */
                    Path = "/"// trỏ vào cookie đó
                });
                return Results.Ok(new
                {
                    message = "LOGOUT_SUCCESS"
                });
            }
            catch(Exception ex)
            {
                throw new Exception("error: " + ex.Message);
            }
        }
    }
}
/*
 => async - awati trong C# 

 await = đợi kết quả
 nhưng không bị “kẹt” trong lúc đợi
 */
