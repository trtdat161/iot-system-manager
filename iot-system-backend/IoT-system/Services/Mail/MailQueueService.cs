using IoT_system.DTOS.Mail;

namespace IoT_system.Services.Mail
{
    public interface MailQueueService
    {
        bool Enqueue(EmailMessageDtos message);
        IAsyncEnumerable<EmailMessageDtos> ReadAllAsync(CancellationToken cancellationToken);
    }
}
