namespace IoT_system.DTOS.Accounts
{
    public class AccountLoginResponseDtos
    {
        public string Message { get; set; } = null!;
        public string LanguageCode { get; set; } = null!; // thêm dòng này vì login cần để hiện ra ngôn ngữ phù hợp
        public string Role { get; set; } = null!; // field Role để sau khi đăng ký biết role nào rồi phân quyền


    }
}
