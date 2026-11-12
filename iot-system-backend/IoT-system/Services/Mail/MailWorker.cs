using IoT_system.DTOS.Mail;
using System.ComponentModel;

namespace IoT_system.Services.Mail
{
    //Chạy nền, lấy thư từ ống ra gửi, lỗi thì thử lại
    public class MailWorker : BackgroundService
    {
        private readonly MailQueueService queue;
        private readonly MailSenderService sender;
        private readonly ILogger<MailWorker> logger;

        public MailWorker(MailQueueService _queue, MailSenderService _sender, ILogger<MailWorker> _logger)
        {
            queue = _queue;
            sender = _sender;
            logger = _logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Chạy mãi: có thư thì lấy ra gửi, hết thư thì chờ (không tốn CPU)
            await foreach (var mail in queue.ReadAllAsync(stoppingToken))
            {
                await SendWithRetry(mail, stoppingToken);
            }
        }

        private async Task SendWithRetry(EmailMessageDtos mail, CancellationToken cancellationToken)
        {
            const int maxAttempts = 3;

            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    await sender.SendAsync(mail, cancellationToken);
                    logger.LogInformation("Email sent to {To}", mail.To);
                    return;
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    return; // app đang tắt
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Send email to {To} failed (attempt {Attempt}/{Max})",
                        mail.To, attempt, maxAttempts);

                    if (attempt < maxAttempts)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(5 * attempt), cancellationToken);
                    }
                }
            }

            logger.LogError("Give up sending email to {To} after {Max} attempts", mail.To, maxAttempts);
        }
    }
}
