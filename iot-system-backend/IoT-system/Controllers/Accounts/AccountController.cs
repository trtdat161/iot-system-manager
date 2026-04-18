using IoT_system.DTOS.Accounts;
using IoT_system.Models;
using IoT_system.Services.Accounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoT_system.Controllers.Accounts
{
    [Route("api/auth")]
    public class AccountController : ControllerBase // ko dùng Controller vì nó mặc định load cả mấy cái của view MVC => nặng
    {
        private readonly AccountServices accountServices;
 
        public AccountController(AccountServices _accountServices)
        {
            accountServices = _accountServices;
        }
        [Produces("application/json")]// BE trả json
        [HttpGet("accounts-list")]
        public async Task<IActionResult> GetAccounts()
        {
            try
            {
                return Ok(await accountServices.FindAll());
            }
            catch (Exception ex) {
                return BadRequest(new {
                    error = ex.Message 
                });
            }
        }

        [AllowAnonymous]// AllowAnonymous vì làn đầu
        [Produces("application/json")]
        [Consumes("application/json")] // BE nhận json
        [HttpPost("register")]
        public async Task<IActionResult> RegisterAccount([FromBody] AccountRegisterDtos account)
        {
            try
            {
                var result = await accountServices.Register(account);
                return Ok(result);
            }
            catch (Exception ex) { 
                return BadRequest(new // BadRequest() nhận vào object rồi serialize thành JSON nên ta phải new object ẩn danh
                { 
                    error = ex.Message 
                });
            }
        }

        // login
        [AllowAnonymous]// AllowAnonymous vì login mới sinh jwt do ban đầu chưa có token nào
        [Produces("application/json")]
        [Consumes("application/json")]
        [HttpPost("login")]
        public async Task<IActionResult> LoginAccount([FromBody] AccountLoginDtos account)
        {
            try
            {
                var result = await accountServices.Login(account);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new // BadRequest() nhận vào object rồi serialize thành JSON nên ta phải new object ẩn danh
                {
                    error = ex.Message
                });
            }
        }

        // logout
        [Authorize]// Authorize vì lúc này đã login vô r nên phải check lại đúng token mới cho logout 
        [Produces("application/json")]
        [Consumes("application/json")]
        [HttpPost("logout")]
        public IActionResult LogoutAccount()
        {
            try
            {
                var result = accountServices.Logout();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new // BadRequest() nhận vào object rồi serialize thành JSON nên ta phải new object ẩn danh
                {
                    error = ex.Message
                });
            }
        }
    }
}
