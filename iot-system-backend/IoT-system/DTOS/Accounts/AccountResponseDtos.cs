namespace IoT_system.DTOS.Accounts
{
    /*
     response server trả về để user có thể get ra các data sạch
     từ đây thay vì phải truy vấn phức tạp vào models hoặc dto có chứa các field nhạy cảm
     */
    public class AccountResponseDtos // dung lam dto mac dinh
    {
        public int Id { get; set; }
        public string Fullname { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Note { get; set; }// null
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool Status { get; set; }
        public int LanguageId { get; set; }
        public string LanguageCode { get; set; } = null!;
        public string? DeviceName { get; set; } // xem coi thiết bị đó có bao nhiêu gia đình/nhóm sử dụng và bao nhiêu người truy cập giám sát...
        public string Role { get; set; } = null!; // field Role để sau khi đăng ký biết role nào rồi phân quyền

    }
}
