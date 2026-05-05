using IoT_system.DTOS.Accounts;
using IoT_system.Services.Accounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
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

    [Authorize]
    [HttpPost("logout")]
    public IActionResult LogoutAccount()
    {
        var result = accountServices.Logout();
        return Ok(result);
    }
}