namespace IoT_system.DTOS.Accounts
{
    public class AccountEditedResonseDtos// dùng để trả về để đổi profile
    {
        public string Fullname { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Password { get; set; } = null!;
        public int LanguageId { get; set; }
    }
}
