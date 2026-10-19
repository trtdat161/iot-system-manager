using AutoMapper;
using BCrypt.Net;
using CaiderProject.Authen;
using IoT_system.Configurations.jwt;

using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Common;
using IoT_system.DTOS.Notification;
using IoT_system.Helpers;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;
using System.Security.Claims;
using System.Security.Cryptography;

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
                Expires = DateTimeOffset.UtcNow.AddMinutes(options.DurationInMinutes),// lấy time là 20 trùng vs bên kia
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
        /*
         generate refreshtoken
         Method này tạo token, gán vào account và gửi cookie. Nó không tự gọi SaveChangesAsync(), 
         nên cần method bên ngoài lưu thay đổi xuống database.
         */
        private void GenerateRefreshToken(Account acc)
        {
            var randomBytes = new byte[64]; // Tạo một mảng chứa 64 byte để lưu dữ liệu ngẫu nhiên.
            using var rng = RandomNumberGenerator.Create();// tạo sinh số ngẫu nhiên dùng cho bảo mật mật mã.
            rng.GetBytes(randomBytes);
            var refreshToken = Convert.ToBase64String(randomBytes);// Chuyển mảng byte thành chuỗi Base64 để dễ lưu trữ và truyền qua cookie.
            acc.RefreshToken = refreshToken;
            acc.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            /*
             Backend đưa cookie vào HTTP response trả về cho browser. Browser nhận response và lưu cookie đó lại.
             */
            httpContextAccessor.HttpContext!.Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(7),
                Path = "/"
            });
        }

        // list account for admin
        public async Task<PagedResponseDtos<AccountResponseDtos>> ListOfAccounts(int page, int pageSize)
        {
            var accounts = dbContext.Accounts.Where(a => a.DeletedAt == null)
                                             .OrderByDescending(a => a.CreatedAt)
                                             .AsNoTracking();


            return await PaginationHelper.GetPagedAsync<Account, AccountResponseDtos>(accounts, page, pageSize, mapper);
        }
       
        // find by id để get tài khoản và hello...
        public async Task<AccountResponseDtos> FindAccountById(int id)
        {
            if (id <= 0)// ko chấp nhận số âm or 0
            {
                throw new BadHttpRequestException("id invalid !");
            }
            var account = await dbContext.Accounts.FindAsync(id);

            if (account == null)
            {
                throw new BadHttpRequestException($"not found account id = {id}!");
            }
            return mapper.Map<AccountResponseDtos>(account);
        }
        // khoá tk
        public async Task<AccountResponseDtos> LockAccountById(int id, string? note)
        {
            if (id <= 0)
            {
                throw new BadHttpRequestException("id invalid !");
            }
            var account = await dbContext.Accounts.FindAsync(id);
            if (account == null)
            {
                throw new BadHttpRequestException($"not found account id = {id}!");
            }
            account.Status = false;
            // xóa refresh token đang lưu trong DB của tài khoản bị khóa, để token đó không dùng được nữa tức khóa rồi thì không refresh được
            account.RefreshToken = null;              
            account.RefreshTokenExpiryTime = null;   
            if (!string.IsNullOrWhiteSpace(note))// phủ định lại tức nếu có giá trị
            {
                account.Note = note;
            }
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
            var account = await dbContext.Accounts.FindAsync(id);
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

        // search keyword + status
        public async Task<PagedResponseDtos<AccountResponseDtos>> Search(
        int page,
        int pageSize,
        string? keyword,
        bool? status
        )
        {
            var query = dbContext.Accounts
                                 .Where(a => a.DeletedAt == null)
                                 .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(a => a.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(a => a.Fullname.ToLower()
                                                    .Contains(keyword.ToLower()));
            }

            return await PaginationHelper.GetPagedAsync<Account, AccountResponseDtos>(
                query, page, pageSize, mapper);
        }


        // xoá tài khoản(soft delete để sau còn lưu đc lịch sử của user đó, thống kê, thuộc thiết bị nào...)
        public async Task<bool> DeleteAccount(int id)
        {
            if (id <= 0)
            {
                throw new BadHttpRequestException("id invalid !");
            }
            var account = await dbContext.Accounts.FindAsync(id);
            if (account == null)
            {
                throw new BadHttpRequestException($"not found account id = {id}!");
            }
            account.DeletedAt = DateTime.UtcNow;
            var result = await dbContext.SaveChangesAsync() > 0; // lưu TRƯỚC

            if (result)
            {
                await SyncDeviceClaimStatusAsync(account.DeviceId); // sync SAU khi DB đã cập nhật
            }

            return result;
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
            await dbContext.Entry(account).Reference(a => a.Language).LoadAsync(); //load thêm data Language cho account

            GenerateJwt(account);
            GenerateRefreshToken(account);
            await dbContext.SaveChangesAsync();

            // dùng account thật đã register map đến AccountResponseDtos trả về cho client
            return mapper.Map<AccountResponseDtos>(account);// trả client để có thể get ra các info user...
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


            // ------- check tồn tại tk trước -------
            var account = await dbContext.Accounts.Include(a => a.Language) // load luôn language
                                                  .FirstOrDefaultAsync(acc => acc.Email == accountLoginDtos.Email);
            if (account == null)
            {
                throw new BadHttpRequestException("Email or password is incorrect");
            }
            // ------- rồi mới check status -------
            if (!account.Status)
            {
                throw new BadHttpRequestException("ACCOUNT_LOCKED"); // FE dùng key này để check
            }
            bool isValid = BCrypt.Net.BCrypt.Verify(accountLoginDtos.Password, account.Password);
            if (!isValid)
            {
                throw new BadHttpRequestException("Email or password is incorrect");
            }

            // -> nếu ok chạy đc đến đây thì thực hiện tiếp
            GenerateJwt(account);
            GenerateRefreshToken(account);// <= lưu chuỗi generate refresh token để sau lấy chuỗi so sánh khi refresh token
            await dbContext.SaveChangesAsync();// <= THÊM (lưu refresh token vào DB)

            // done
            return new AccountLoginResponseDtos
            {
                Message = "LOGIN_SUCCESS",
                LanguageCode = account.Language.Code,
                Role = account.Role // trả về để biết role nào rồi phân quyền
            };
        }
        // RefreshToken
        public async Task<AccountLoginResponseDtos> RefreshToken()
        {
            // Lấy Refresh Token từ cookie để so với chuỗi refresh
            var refreshToken = httpContextAccessor.HttpContext!.Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken)) // Server đọc token mà trình duyệt gửi lên. Nếu không có token thì từ chối
            {
                throw new BadHttpRequestException("REFRESH_TOKEN_MISSING");
            }
            // tìm tk trong db và kiểm tra token gửi lên có khớp token đang lưu trong db khônResponse.Cookies.Appendg
            var account = await dbContext.Accounts.Include(a => a.Language)
                .FirstOrDefaultAsync(a => a.RefreshToken == refreshToken && a.DeletedAt == null && a.Status); // tài khoản bị khóa thì không cho refresh

            if (account == null || account.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                throw new BadHttpRequestException("REFRESH_TOKEN_INVALID");
            }

            GenerateJwt(account);//  tạo access token mới 
            GenerateRefreshToken(account);// tạo refresh token mới
            await dbContext.SaveChangesAsync();

            return new AccountLoginResponseDtos
            {
                Message = "REFRESH_SUCCESS",
                LanguageCode = account.Language.Code,
                Role = account.Role
            };
        }


        // logout 
        public async Task<AccountLogoutResponseDtos> Logout()
        {
            var idClaim = httpContextAccessor.HttpContext!.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(idClaim, out var accountId))
            {
                var account = await dbContext.Accounts.FindAsync(accountId);
                if (account != null)
                {
                    // xóa Refresh Token đang lưu trong database
                    account.RefreshToken = null;
                    account.RefreshTokenExpiryTime = null;
                    await dbContext.SaveChangesAsync();
                }
            }

            httpContextAccessor.HttpContext!.Response.Cookies.Delete("access_token", new CookieOptions
            { 
                HttpOnly = true, 
                Secure = true, 
                SameSite = SameSiteMode.None, 
                Path = "/" });
                httpContextAccessor.HttpContext!.Response.Cookies.Delete("refresh_token", new CookieOptions
            { 
                HttpOnly = true, 
                Secure = true, 
                SameSite = SameSiteMode.None, 
                Path = "/" });

            return new AccountLogoutResponseDtos { Message = "LOGOUT_SUCCESS" };
        }

        /* ------------ confirm password ------------ */
        public async Task<AccountConfirmPasswordResponseDtos> ConfirmPasswordAfterChange(AccountConfirmPasswordDtos passwordDtos, int idAccount)
        {
            if (string.IsNullOrWhiteSpace(passwordDtos.Password))
            {
                throw new BadHttpRequestException("re-enter the old password!");
            }
            var currentAccount = await dbContext.Accounts.FindAsync(idAccount);

            if(currentAccount == null)
            {
                throw new BadHttpRequestException("not found account");
            }

            var isValid = BCrypt.Net.BCrypt.Verify(passwordDtos.Password, currentAccount.Password);
            if(!isValid)
            {
                throw new BadHttpRequestException("old password invalid !");
            }
            // tự trả về dto
            return new AccountConfirmPasswordResponseDtos
            {
                Message = "OLD_PASSWORD_OK"
            };
        }

        /* ------------ edit profile ------------ */
        public async Task<AccountResponseDtos> EditProfile(AccountEditedResonseDtos accountEdit, int id)
        {
            var account = await dbContext.Accounts.FindAsync(id);// account model thật

            if (account == null)
            {
                throw new BadHttpRequestException("not found account!");
            }
            if (await dbContext.Accounts.AnyAsync(acc => acc.Email == accountEdit.Email && acc.Id != id))// check xem email hiện tại có chưa nếu có rồi thì bá, và chech nếu trùng id đã có tức là id hiện tại thì cho qua chứ nếu báo cả id thì sẽ ko bao h sửa đc profile
            {
                throw new BadHttpRequestException("Email already exists!");
            }
            
            // sau khi check mail thì mới gán
            account.Fullname = accountEdit.Fullname;
            account.Email = accountEdit.Email;
            account.LanguageId = accountEdit.LanguageId;
            if (!string.IsNullOrWhiteSpace(accountEdit.Password))// nếu có password thì mới hash và đổi
            {
                account.Password = BCrypt.Net.BCrypt.HashPassword(accountEdit.Password);
            }
            
            await dbContext.SaveChangesAsync();
            return mapper.Map<AccountResponseDtos>(account);
        }

        // giải quyết tài khoản isClaim bị xoá
        private async Task SyncDeviceClaimStatusAsync(int? deviceId)
        {
            if (deviceId == null)
            {
                return;
            }

            bool stillHasActiveUser = await dbContext.Accounts.AnyAsync(a => a.DeviceId == deviceId && a.DeletedAt == null);

            if (stillHasActiveUser) 
            {
                return;
            }

            await dbContext.Devices
                .Where(d => d.Id == deviceId && d.IsClaimed)
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.IsClaimed, false));
        }
    }
}
/*
 => async - awati trong C# 

 await = đợi kết quả
 nhưng không bị “kẹt” trong lúc đợi

    (findAsync): 
    thao tác với id là PK trong 1 số trường hợp dùng findAsync sẽ nhanh và tối ưu hơn firstOrDefault
    do thao tác với id là PK trong 1 số trường hợp dùng findAsync sẽ nhanh và tối ưu hơn firstOrDefault
 */
