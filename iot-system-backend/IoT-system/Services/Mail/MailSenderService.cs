using IoT_system.DTOS.Mail;

namespace IoT_system.Services.Mail
{
    public interface MailSenderService
    {
        // gửi email thật
        Task SendAsync(EmailMessageDtos message, CancellationToken cancellationToken);
    }
}
