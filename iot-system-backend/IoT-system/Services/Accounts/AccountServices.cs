using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Common;
using IoT_system.DTOS.Notification;
using IoT_system.Models;
using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Services.Accounts
{
    public interface AccountServices
    {
        public Task<PagedResponseDtos<AccountResponseDtos>> ListOfAccounts(int page, int pageSize); // dashboard admin list user

        public Task<AccountResponseDtos> FindAccountById(int id);// find by id get detail
        //public Task<AccountEditProfileResonseDtos> AccountEditProfile(int id);// trả vè thông tin để thay đổi profile

        public Task<AccountResponseDtos> LockAccountById(int id, string? note);// khoá tk
        public Task<bool> DeleteAccount(int id);
        public Task<AccountResponseDtos> OpenAccountById(int id);// Mở tk
        public Task<PagedResponseDtos<AccountResponseDtos>> Search(int page, int pageSize, string? keyword, bool? status); // search keyword
        public Task<AccountResponseDtos> EditProfile(AccountEditedResonseDtos accountEdit , int id);

        // --------------------------- auth --------------------------
        public Task<AccountResponseDtos> Register(AccountRegisterDtos dto);// iresult
        public Task<AccountLoginResponseDtos> Login(AccountLoginDtos dto);
        public AccountLogoutResponseDtos Logout();

        // user
    }
}
/*
 public async Task<AccountDto> GetAccountDetail(int id, ClaimsPrincipal user)
{
    var role = user.FindFirst(ClaimTypes.Role)?.Value;
    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    // nếu không phải admin và cũng không phải chính mình
    if (role != "admin" && userId != id.ToString())
        throw new UnauthorizedAccessException();

    return await FindAccountById(id);
}
 */