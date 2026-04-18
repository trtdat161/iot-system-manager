using AutoMapper;
using CaiderProject.Authen;
using IoT_system.Configurations.jwt;

using IoT_system.DTOS.Accounts;
using IoT_system.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Diagnostics;
using System.Text.RegularExpressions;

namespace IoT_system.Services.Accounts
{
    public class AccountServicesImpl : AccountServices
    {
        private readonly DatabaseContext dbContext;
        private readonly JwtTokenServices jwtTokenServices;
        private readonly IHttpContextAccessor httpContextAccessor; //IHttpContextAccessor
        private readonly JwtOptions options;
        private readonly IMapper mapper;
        // đa ngôn ngữ
        private readonly IStringLocalizer<Message> localizer;

        public AccountServicesImpl(
            DatabaseContext _dbContext,
            JwtTokenServices _jwtTokenServices,
            IHttpContextAccessor _httpContextAccessor,
            IOptions<JwtOptions> _options,// IOptions   
            IMapper _mapper, 
            IStringLocalizer<Message> _localizer // đa ngôn ngữ
            ) 
        {
            dbContext = _dbContext;
            jwtTokenServices = _jwtTokenServices;
            httpContextAccessor = _httpContextAccessor;
            options = _options.Value;// có IOptions thêm .Value
            mapper = _mapper;
            localizer = _localizer;
        }
        // generate jwt
        private void GenerateJwt(Account acc)
        {
            var token = jwtTokenServices.GenerateToken(acc);

            httpContextAccessor.HttpContext!.Response.Cookies.Append("access_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // false khi dev test local
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddMinutes(options.DurationInMinutes),// lấy time là 15 trùng vs bên kia
                Path = "/"
            });
        }
        // list account
        public async Task<List<AccountResponseDtos>> FindAll()
        {
            
            var accounts = await dbContext.Accounts.ToListAsync();
            return mapper.Map<List<AccountResponseDtos>>(accounts);
        }

        // ------------------ register ------------------
        public async Task<AccountResponseDtos> Register(AccountRegisterDtos accountRegisterDtos)// dto parameter
        {
                // fullname
                if (string.IsNullOrWhiteSpace(accountRegisterDtos.Fullname))
                {
                    throw new Exception(localizer["Fullname_Required"]);
                }

                // email
                if (string.IsNullOrWhiteSpace(accountRegisterDtos.Email))
                {
                    throw new Exception(localizer["Email_Required"]);
                }
                if (!Regex.IsMatch(accountRegisterDtos.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    throw new Exception(localizer["Email_Invalid"]);
                }
                if (await dbContext.Accounts.AnyAsync(acc => acc.Email == accountRegisterDtos.Email))// check email unique
                {
                    throw new Exception(localizer["Email_Existed"]);
                }

                // password
                if (string.IsNullOrWhiteSpace(accountRegisterDtos.Password))
                {
                    throw new Exception(localizer["Password_Required"]);
                }
                if (!Regex.IsMatch(accountRegisterDtos.Password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$"))
                {
                    throw new Exception(localizer["Password_Invalid"]);
                }

                // cho user chọn ngôn ngữ khi đăng ký
                if (!await dbContext.Languages.AnyAsync(l => l.Id == accountRegisterDtos.LanguageId))
                {
                    throw new Exception(localizer["Language_Invalid"]);
                }

                // Map DTO -> 
                accountRegisterDtos.Password = BCrypt.Net.BCrypt.HashPassword(accountRegisterDtos.Password);// hash rồi map
                var account = mapper.Map<Account>(accountRegisterDtos);
                // set override value default
                account.Role = "user";
                account.Status = true;
                account.CreatedAt = DateTime.UtcNow;

                // (save db)
                dbContext.Accounts.Add(account);
                await dbContext.SaveChangesAsync(); // insert thật vào db

                GenerateJwt(account);

                // dùng account thật đã register map đến AccountResponseDtos trả về cho client
                var accountDto = mapper.Map<AccountResponseDtos>(account);// trả client để có thể get ra các info user...
                return accountDto;
                /* ---- trả về dto với các field sạch thay vì trả về account chứa các field nhạy cảm,... ---- */
        }
            

        // ------------------ login ------------------
        public async Task<AccountLoginResponseDtos> Login(AccountLoginDtos accountLoginDtos)
        {
                // email login
                if (string.IsNullOrWhiteSpace(accountLoginDtos.Email))
                {
                    throw new Exception(localizer["Email_Required"]);
                }
                if (!Regex.IsMatch(accountLoginDtos.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    throw new Exception(localizer["Email_Invalid"]);
                }// ko check email đã tồn tại vì nếu làm vậy sẽ ko bao h login đc


                // password
                if (string.IsNullOrWhiteSpace(accountLoginDtos.Password))
                {
                    throw new Exception(localizer["Password_Required"]);
                }// ko check Regex vì nếu lỡ đủ patern nhưng sai pass thì cũng đi luôn nên chỉ check password rỗng


                // check
                var account = await dbContext.Accounts.FirstOrDefaultAsync(acc => acc.Email == accountLoginDtos.Email && acc.Status == true);
                if (account == null)
                {
                    throw new Exception(localizer["Login_Wrong"]);
                }

                bool isValid = BCrypt.Net.BCrypt.Verify(accountLoginDtos.Password, account.Password);
                if (!isValid)
                {
                    throw new Exception(localizer["Login_Wrong"]);
                }

                // -> nếu ok chạy đc đến đây thì thực hiện tiếp
                GenerateJwt(account);

                // done
                return new AccountLoginResponseDtos
                {
                    Message = "LOGIN_SUCCESS"
                };
        }
            

        // logout 
        public AccountLogoutResponseDtos Logout()
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
                return new AccountLogoutResponseDtos
                {
                    Message = "LOGOUT_SUCCESS"
                };
            }   
    }
}
/*
 => async - awati trong C# 

 await = đợi kết quả
 nhưng không bị “kẹt” trong lúc đợi
 */
