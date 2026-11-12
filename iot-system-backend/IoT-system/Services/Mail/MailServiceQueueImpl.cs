using IoT_system.DTOS.Mail;
using System.Threading.Channels;

namespace IoT_system.Services.Mail
{
    public class MailServiceQueueImpl : MailQueueService
    {
        private readonly Channel<EmailMessageDtos> channel;

        public MailServiceQueueImpl()
        {
            var options = new BoundedChannelOptions(200)
            {
                FullMode = BoundedChannelFullMode.Wait,
                SingleReader = true
            };
            channel = Channel.CreateBounded<EmailMessageDtos>(options);
        }

        public bool Enqueue(EmailMessageDtos message)
        {
            return channel.Writer.TryWrite(message);
        }

        public IAsyncEnumerable<EmailMessageDtos> ReadAllAsync(CancellationToken cancellationToken)
        {
            return channel.Reader.ReadAllAsync(cancellationToken);
        }
    }
}
/*
Channel giống một cái ống: MQTT bỏ thư vào (Writer), worker lấy thư ra (Reader), hai bên không phải chờ nhau.
Giới hạn 200 thư để không đầy RAM nếu Gmail lỗi lâu
TryWrite không bao giờ chờ hay ném lỗi, hàng đợi đầy thì chỉ trả về false
 */
