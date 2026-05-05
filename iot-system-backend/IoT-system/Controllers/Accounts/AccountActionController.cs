using IoT_system.Services.Accounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Controllers.Accounts
{
    [Route("api/action")]
    public class AccountActionController : Controller
    {
        private readonly AccountServices accountServices;   

        public AccountActionController(AccountServices _accountServices)
        {
            accountServices = _accountServices;
        }

        /* Authorize(Roles = "admin") là dòng chủ chốt để phân quyền */
        [Authorize(Roles = "admin")]// do sánh với alaims role trong token ... đã đc cấu hình lấy từ db
        [Produces("application/json")]// BE trả json
        [HttpGet("accounts-list")]
        public async Task<IActionResult> GetAccounts()
        {
             return Ok(await accountServices.ListOfAccounts());
        }

        // find by id admin
        [Authorize(Roles = "admin")]
        [Produces("application/json")]
        [HttpGet("account-detail/{id}")]
        public async Task<IActionResult> GetUserByIdForAdmin(int id) {
            
             return Ok(await accountServices.FindAccountById(id));
        }

        // find by id user
        [Authorize(Roles = "user")]
        [Produces("application/json")]
        [HttpGet("account-detail/{id}")]
        public async Task<IActionResult> GetUserByIdForUser(int id)
        {

            return Ok(await accountServices.FindAccountById(id));
        }
    }
}
