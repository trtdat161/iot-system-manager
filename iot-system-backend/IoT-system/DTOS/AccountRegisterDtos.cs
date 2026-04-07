namespace IoT_system.DTOS
{
    // DTO này dùng đẻ móc ra các field cần để register login
    public class AccountRegisterDtos
    {
        public string Fullname { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public int LanguageId { get; set; }

    }
}
