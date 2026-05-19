using IoT_system.Services.Accounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Controllers.Accounts
{
    [Route("api/action")]
    public class AccountActionController : ControllerBase
    {
        private readonly AccountServices accountServices;   

        public AccountActionController(AccountServices _accountServices)
        {
            accountServices = _accountServices;
        }

        /* Authorize(Roles = "admin") là dòng chủ chốt để phân quyền */
        [Authorize(Roles = "admin")]// do sánh với alaims role trong token ... đã đc cấu hình lấy từ db
        [Produces("application/json")]// BE trả json
        [HttpGet("account-list")]
        public async Task<IActionResult> GetAccounts([FromQuery] int page = 1, [FromQuery] int pageSize = 10) // FromQuery
        {
            var result = await accountServices.ListOfAccounts(page, pageSize);
             return Ok(result);
        }

        // khoả tk
        [Authorize(Roles = "admin")]// do sánh với alaims role trong token ... đã đc cấu hình lấy từ db
        [Produces("application/json")]// BE trả json
        [HttpPost("account-lock/{id}")]
        public async Task<IActionResult> LockAccount(int id, string note)
        {
            var result = await accountServices.LockAccountById(id, note);
            return Ok(result);
        }

        // mớ tk
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpPost("account-unlock/{id}")]
        public async Task<IActionResult> UnlockAccount(int id)
        {
            var result = await accountServices.OpenAccountById(id);
            return Ok(result);
        }

        // xoá tài khoản
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpDelete("delete-account/{id}")]
        public async Task<IActionResult> RemoveAccount(int id)
        {
            var result = await accountServices.DeleteAccount(id);
            return Ok(result);
        }

        // search 
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("search-account")]
        public async Task<IActionResult> SeachAccount([FromQuery] string? name, [FromQuery] bool? status)
        /* không dùng fromQuery cũng đc nhưng để từ minh querystring nên có FromQuery */
        {
            var result = await accountServices.Search(name, status);
            return Ok(result);
        }
       
    }
}
