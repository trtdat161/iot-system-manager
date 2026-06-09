using IoT_system.DTOS.Accounts;
using IoT_system.Services.Accounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
        public async Task<IActionResult> LockAccount(int id, [FromQuery] string note)
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
        public async Task<IActionResult> SeachAccount([FromQuery] string? keyword, [FromQuery] bool? status)
        /* không dùng fromQuery cũng đc nhưng để từ minh querystring nên có FromQuery */
        {
            var result = await accountServices.Search(keyword, status);
            return Ok(result);
        }

        // findById xem detail
        [Authorize] // đăng nhập là truy cập đc method này, sau mới check role bên trong
        [Produces("application/json")]
        [HttpGet("find-account-by-id/{id}")]
        public async Task<IActionResult> FindAccountById(int id)
        {
            var currentUser = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var isAdmin = User.IsInRole("admin");

            // chỉ user xem đc chính mình
            if(!isAdmin && currentUser != id)
            {
                return Forbid(); // 403 
            }

            var account = await accountServices.FindAccountById(id);
            return Ok(account);
        }

        // xem profile mà ko cần truyền id vô tham số
        [Authorize]// chỉ xác thực jwt còn lại role nào cũng đăng nhập đc
        [Produces("application/json")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()// ko truyền id dễ dàng gọi api xem info me
        {
            var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await accountServices.FindAccountById(id);
            return Ok(result);

            /* -------- (TRÊN LÀ ĐANG GET INFO DÙNG THEO KIỂU KHI LÀM VIỆC VỚI JWT) ---------
             * 
             * User: là user hiện tại đang dăng nhập
             * FindFirstValue: là lấy giá trị của 1 claim
             * ClaimTypes.NameIdentifier: Là claim chứa ID người dùng
             * ! là chắc chắn giá trị ko null 
             * 
             * TÓM LẠI: => (Lấy UserId từ JWT của người đang đăng nhập rồi chuyển thành kiểu int) */
        }

        // đôi profile
        [Authorize]// chỉ xác thực jwt còn lại role nào cũng đăng nhập đc đổi đc
        [Produces("application/json")]
        [HttpPut("profile")]
        public async Task<IActionResult> EditProfiles([FromBody] AccountEditedResonseDtos accountEdited)
        {
            var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await accountServices.EditProfile(accountEdited, id);
            return Ok(result);
        }
    }
}
