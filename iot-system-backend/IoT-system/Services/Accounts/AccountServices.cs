using IoT_system.DTOS.Accounts;
using IoT_system.Models;
using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Services.Accounts
{
    public interface AccountServices
    {
        public Task<List<AccountResponseDtos>> FindAll();
        public Task<AccountResponseDtos> Register(AccountRegisterDtos dto);// iresult
        public Task<AccountLoginResponseDtos> Login(AccountLoginDtos dto);
        public AccountLogoutResponseDtos Logout();
    }
}
