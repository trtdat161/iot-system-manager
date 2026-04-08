namespace IoT_system.DTOS
{
    /*
     response server trả về để user có thể get ra các data sạch
     từ đây thay vì phải truy vấn phức tạp vào models hoặc dto có chứa các field nhạy cảm
     */
    public class AccountResponseDtos
    {
        public int Id { get; set; }
        public string Fullname { get; set; } = null!;
        public string Email { get; set; } = null!;
        public int LanguageId { get; set; }

    }
}
