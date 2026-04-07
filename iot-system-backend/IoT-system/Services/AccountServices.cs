using IoT_system.Models;

namespace IoT_system.Services
{
    public interface AccountServices
    {
        public IResult Register(Account account);// iresult
        public bool Login(string email, string password);
    }
}
