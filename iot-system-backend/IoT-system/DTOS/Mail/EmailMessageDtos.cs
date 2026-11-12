namespace IoT_system.DTOS.Mail
{
    public class EmailMessageDtos
    {
        public string To { get; set; } = "";
        public string Subject { get; set; } = "";
        public string HtmlBody { get; set; } = "";
    }
}
// EmailMessageDto.cs là một “lá thư” nằm trong hàng đợi gửi cho ai... tiêu đề, nội dung