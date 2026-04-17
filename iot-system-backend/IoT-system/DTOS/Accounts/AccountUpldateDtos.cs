using IoT_system.Models;

namespace IoT_system.DTOS.Accounts
{
    // DTO này dùng để khi update profile account
    public class AccountUpldateDtos
    {
        public int Id { get; set; }
        public string Fullname { get; set; } = null!;// cho user update tên
        public string? Password { get; set; } = null!;// cho user đổi password và có thể null nếu ko đổi
        public int LanguageId { get; set; }// cho user đổi language

    }
}

