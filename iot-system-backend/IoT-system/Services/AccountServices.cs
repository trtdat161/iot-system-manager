using IoT_system.DTOS;
using IoT_system.Models;

namespace IoT_system.Services
{
    public interface AccountServices
    {
        public Task<IResult> Register(AccountRegisterDtos dto);// iresult
        public Task<IResult> Login(AccountLoginDtos dto);
    }
}
