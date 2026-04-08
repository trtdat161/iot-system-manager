using IoT_system.DTOS;
using IoT_system.Models;
using Mapster;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text.RegularExpressions;

namespace IoT_system.Services
{
    public class AccountServicesImpl : AccountServices
    {
        private readonly DatabaseContext dbContext;

        public AccountServicesImpl(DatabaseContext _dbContext)
        {
            dbContext = _dbContext;
        }
        public async Task<IResult> Register(AccountRegisterDtos dto)// dto parameter
        {
            try
            {
                // fullname
                if (string.IsNullOrWhiteSpace(dto.Fullname))
                {
                    return Results.BadRequest("tên không được để trống !");
                }

                // email
                if (string.IsNullOrWhiteSpace(dto.Email))
                {
                    return Results.BadRequest("email không được để trống !");
                }
                if (!Regex.IsMatch(dto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    return Results.BadRequest("email không hợp lệ !");
                }
                if(await dbContext.Accounts.AnyAsync(acc => acc.Email == dto.Email))// check email unique
                {
                    return Results.BadRequest("email này đã tồn tại !");
                }

                // password
                if (string.IsNullOrWhiteSpace(dto.Password)) { 
                    return Results.BadRequest("không để trống passowrd !");
                }
                if(!Regex.IsMatch(dto.Password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$"))
                {
                    return Results.BadRequest("mật khẩu ít nhất 6 ký tự, 1 chữ hoa, 1 chữ thường và 1 chữ số !");
                }

                // cho user chọn ngôn ngữ khi đăng ký
                if(!await dbContext.Languages.AnyAsync(l => l.Id == dto.LanguageId))
                {
                    return Results.BadRequest("select your language !");
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
                return Results.BadRequest(new
                {
                    error = "error :"+ ex.Message,
                });
            }
        }
        public async Task<IResult> Login(AccountLoginDtos dto)
        {
            try
            {
                // email login
                if (string.IsNullOrWhiteSpace(dto.Email))
                {
                    return Results.BadRequest("email không được để trống !");
                }
                if(!Regex.IsMatch(dto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    return Results.BadRequest("email không hợp lệ !");
                }
                // ko check email đã tồn tại vì nếu làm vậy sẽ ko bao h login đc

                // password
                if (string.IsNullOrWhiteSpace(dto.Password))
                {
                    return Results.BadRequest("không để trống passowrd !");
                }
                // ko check Regex vì nếu lỡ đủ patern nhưng sai pass thì cũng đi luôn nên chỉ check password rỗng

                // check
                var account = await dbContext.Accounts.FirstOrDefaultAsync(acc => acc.Email == dto.Email && acc.Status == true);
                if (account == null)
                {
                    return Results.BadRequest("sai email hoặc mật khẩu !");
                }
                // nếu ok chạy đc đến đây thì thực hiện tiếp
                bool isValid = BCrypt.Net.BCrypt.Verify(dto.Password, account.Password);
                if (!isValid)
                {
                    return Results.BadRequest("sai email hoặc mật khẩu !");
                }
                // done
                return Results.Ok(new
                {
                    Msg_login = "login done"
                });
            }
            catch(Exception ex)
            {
                return Results.BadRequest(new
                {
                    error = "error :" + ex.Message,
                });
            }
        }
    }
}
/*
 => async - awati trong C# 

 await = đợi kết quả
 nhưng không bị “kẹt” trong lúc đợi
 */
