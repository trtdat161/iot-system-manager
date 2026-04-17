namespace IoT_system.DTOS.Accounts
{
    // DTO này dùng đẻ móc ra các field cần để register login
    public class AccountLoginDtos
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;

    }
}
