using IoT_system.DTOS.Mail;
using MailKit.Security;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;

namespace IoT_system.Services.Mail
{
    public class MailSenderServiceImpl : MailSenderService 
    {
        // gửi email thật
        private readonly EmailSettings settings;

        public MailSenderServiceImpl(IOptions<EmailSettings> _options)
        {
            settings = _options.Value;
        }

        public async Task SendAsync(EmailMessageDtos message, CancellationToken cancellationToken)
        {
            var mime = new MimeMessage();
            mime.From.Add(new MailboxAddress(settings.SenderName, settings.SenderEmail));
            mime.To.Add(MailboxAddress.Parse(message.To));
            mime.Subject = message.Subject;
            mime.Body = new BodyBuilder { HtmlBody = message.HtmlBody }.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(settings.Host, settings.Port, SecureSocketOptions.StartTls, cancellationToken);
            await smtp.AuthenticateAsync(settings.Username, settings.Password, cancellationToken);
            await smtp.SendAsync(mime, cancellationToken);
            await smtp.DisconnectAsync(true, cancellationToken);
        }
    }
}
/*
IOptions<EmailSettings> lấy cấu hình ở Bước 1 và đưa vào class.
Quy trình gửi mail gồm 4 bước: kết nối -> đăng nhập -> gửi -> ngắt kết nối. Cổng 587 cùng StartTls là chuẩn của Gmail.
Mỗi mail dùng một SmtpClient mới cho đơn giản. Mail cảnh báo rất thưa nên không cần giữ kết nối.
Sau này đổi sang Resend/SendGrid thì chỉ viết lại class này, phần còn lại không đụng.
 */