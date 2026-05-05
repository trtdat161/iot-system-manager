using AutoMapper;
using CaiderProject.Authen;
using IoT_system.Configurations.jwt;

using IoT_system.DTOS.Accounts;
using IoT_system.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        public AccountServicesImpl(
            DatabaseContext _dbContext,
            JwtTokenServices _jwtTokenServices,
            IHttpContextAccessor _httpContextAccessor,
            IOptions<JwtOptions> _options,// IOptions   
            IMapper _mapper
            ) 
        {
            dbContext = _dbContext;
            jwtTokenServices = _jwtTokenServices;
            httpContextAccessor = _httpContextAccessor;
            options = _options.Value;// có IOptions thêm .Value
            mapper = _mapper;
        }
        // generate jwt
        private void GenerateJwt(Account acc)
        {
            var token = jwtTokenServices.GenerateToken(acc);

            httpContextAccessor.HttpContext!.Response.Cookies.Append("access_token", token, new CookieOptions
            {
                HttpOnly = true,// true js không được đọc cookie này
                Secure = true, // Cookie chỉ được gửi qua HTTPS, không gửi qua HTTP
                SameSite = SameSiteMode.None, //Cookie được phép gửi cross-origin (khác domain/port)
                Expires = DateTimeOffset.UtcNow.AddMinutes(options.DurationInMinutes),// lấy time là 15 trùng vs bên kia
                Path = "/"
            });
            /*
             None   => gửi được từ localhost:5173 => localhost:7115 (bắt buộc Secure=true)
             Lax    => chỉ gửi khi cùng origin hoặc navigate bằng link
             Strict => chỉ gửi khi cùng origin tuyệt đối

            Quy tắc "bộ đôi bất ly thân" cần nhớ:
            SameSite=None  <->  Secure=true  (tách ra là browser DROP cookie)
             */
        }
        // list account for admin
        public async Task<List<AccountResponseDtos>> ListOfAccounts()
        {

            var accounts = await dbContext.Accounts.Where(a => a.DeletedAt == null).AsNoTracking().ToListAsync();
            return mapper.Map<List<AccountResponseDtos>>(accounts);
        }
        // detail
        public async Task<AccountResponseDtos> FindAccountById(int id)
        {
            if(id <= 0)// ko chấp nhận số âm or 0
            {
                throw new BadHttpRequestException("id invalid !");
            }
            var account = await dbContext.Accounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);

            if (account == null)
            {
                throw new BadHttpRequestException($"not found account id = {id}!");
            }
            return mapper.Map<AccountResponseDtos>(account);
        }
        // khoá tk
        public async Task<AccountResponseDtos> LockAccountById(int id)
        {
            if(id <= 0)
            {
                throw new BadHttpRequestException("id invalid !");
            }
            var account = dbContext.Accounts.FirstOrDefault(a => a.Id == id);
            if(account == null)
            {
                throw new BadHttpRequestException($"not found account id = {id}!");
            }
            account.Status = false;
            await dbContext.SaveChangesAsync(); // lưu thay đổi sau khí khoá
            return mapper.Map<AccountResponseDtos>(account);
        }
        // Mở tk
        public async Task<AccountResponseDtos> OpenAccountById(int id)
        {
            if (id <= 0)
            {
                throw new BadHttpRequestException("id invalid !");
            }
            var account = dbContext.Accounts.FirstOrDefault(a => a.Id == id);
            if (account == null)
            {
                throw new BadHttpRequestException($"not found account id = {id}!");
            }
            if (account.Status)
            {
                return mapper.Map<AccountResponseDtos>(account);// nếu = true tức mở rồi thì thôi
            }
            account.Status = true;
            await dbContext.SaveChangesAsync(); // lưu thay đổi sau khí khoá
            return mapper.Map<AccountResponseDtos>(account);
        }
        // ------------------ register ------------------
        public async Task<AccountResponseDtos> Register(AccountRegisterDtos accountRegisterDtos)// dto parameter
        {
                // fullname
                if (string.IsNullOrWhiteSpace(accountRegisterDtos.Fullname))
                {
                    throw new BadHttpRequestException("Fullname is required");
                }

                // email
                if (string.IsNullOrWhiteSpace(accountRegisterDtos.Email))
                {
                    throw new BadHttpRequestException("Email is required");
                }
                if (!Regex.IsMatch(accountRegisterDtos.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    throw new BadHttpRequestException("Email is invalid");
                }
                if (await dbContext.Accounts.AnyAsync(acc => acc.Email == accountRegisterDtos.Email))// check email unique
                {
                    throw new BadHttpRequestException("Email already exists");
                }

                // password
                if (string.IsNullOrWhiteSpace(accountRegisterDtos.Password))
                {
                    throw new BadHttpRequestException("Password is required");
                }
                if (!Regex.IsMatch(accountRegisterDtos.Password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$"))
                {
                    throw new BadHttpRequestException("Password must be at least 6 characters with 1 uppercase, 1 lowercase and 1 number");
                }

                // cho user chọn ngôn ngữ khi đăng ký
                if (!await dbContext.Languages.AnyAsync(l => l.Id == accountRegisterDtos.LanguageId))
                {
                    throw new BadHttpRequestException("Language is invalid");
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

                // load lại account kèm Language vì sau insert navigation property chưa được load
                await dbContext.Entry(account).Reference(a => a.Language).LoadAsync();

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
                    throw new BadHttpRequestException("Email is required");
                }
                if (!Regex.IsMatch(accountLoginDtos.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    throw new BadHttpRequestException("Email is invalid");
                }// ko check email đã tồn tại vì nếu làm vậy sẽ ko bao h login đc


                // password
                if (string.IsNullOrWhiteSpace(accountLoginDtos.Password))
                {
                    throw new BadHttpRequestException("Password is required");
                }// ko check Regex vì nếu lỡ đủ patern nhưng sai pass thì cũng đi luôn nên chỉ check password rỗng


                // check
                var account = await dbContext.Accounts.FirstOrDefaultAsync(acc => acc.Email == accountLoginDtos.Email && acc.Status == true);
                if (account == null)
                {
                    throw new BadHttpRequestException("Email or password is incorrect");
                }

                bool isValid = BCrypt.Net.BCrypt.Verify(accountLoginDtos.Password, account.Password);
                if (!isValid)
                {
                    throw new BadHttpRequestException("Email or password is incorrect");
                }

                // -> nếu ok chạy đc đến đây thì thực hiện tiếp
                GenerateJwt(account);

                // done
                return new AccountLoginResponseDtos
                {
                    Message = "LOGIN_SUCCESS",
                    LanguageCode = account.Language.Code,
                    Role = account.Role // trả về để biết role nào rồi phân quyền
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
