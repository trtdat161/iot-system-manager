using IoT_system.DTOS.Accounts;
using IoT_system.Services.Accounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]// đánh dấu controller này là 1 API, bật các tính năng hỗ trợ AP
[Route("api/auth")]
public class AccountAuthController : ControllerBase
{
    private readonly AccountServices accountServices;

    public AccountAuthController(AccountServices _accountServices)
    {
        accountServices = _accountServices;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterAccount([FromBody] AccountRegisterDtos account)
    {
        var result = await accountServices.Register(account);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> LoginAccount([FromBody] AccountLoginDtos account)
    {
        var result = await accountServices.Login(account);
        return Ok(result);
    }

    // refresh
    [AllowAnonymous] // Access token có thể hết hạn nên cần cho phép gọi API mà không cần access token hợp lệ = dùng [AllowAnonymous]
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshTokenAccountU()
    {
        var result = await accountServices.RefreshToken();
        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> LogoutAccount()   // sync => async
    {
        var result = await accountServices.Logout();   // thêm await
        return Ok(result);
    }
}