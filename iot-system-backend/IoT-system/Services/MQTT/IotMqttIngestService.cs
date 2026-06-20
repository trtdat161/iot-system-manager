using IoT_system.DTOS.MQTT;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;
using System;
using System.Text.Json;
/*  QUAN TRỌNG NHẤT: file mqtt là cấu hình lắng nghe toàn app 24/24 đê xử lý esp gửi lên,... */
namespace IoT_system.Services.Mqtt
{
    /*
     Subscribe = “đăng ký nhận tin”,
     Publish = “gửi tin đi”
     */
    public class IotMqttIngestService : BackgroundService // BackgroundService (là cái chạy ngầm song song giúp cho hệ thống chạy mãi, để luôn lắng nghe user request điều khiển thiết bị hoặc esp gửi data lên)
    {
        private readonly MqttClient mqtt;// MqttClient = bộ não giao tiếp MQTT được đóng gói lại
        private readonly IServiceScopeFactory scopeFactory;// Tạo “mini DI container” tạm thời để lấy service scoped hợp lệ
        private readonly ILogger<IotMqttIngestService> logger;
        /* 
         * ILogger kiểu nó sẽ theo dõi toàn app Dùng để biết:
         * có bao nhiêu message MQTT
         * data gửi lên có đúng không
         * hệ thống có đang sống không
         * ILogger -> Khi hệ thống crash, không phải đoán — log sẽ nói rõ lỗi gì.
         */

        private IMqttClient _client;

        public IotMqttIngestService(
            MqttClient _mqtt,
            IServiceScopeFactory _scopeFactory,
            ILogger<IotMqttIngestService> _logger)
        {
            mqtt = _mqtt;
            scopeFactory = _scopeFactory;
            logger = _logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // khởi tạo mqtt client, đóng vai trò như “xưởng sản xuất” để tạo ra các thành phần MQTT
            var factory = new MqttFactory();
            _client = factory.CreateMqttClient();

            var options = new MqttClientOptionsBuilder()
                .WithTcpServer("broker.hivemq.com", 1883)// đăng ký vào địa chỉ máy chủ, broker public
                .WithClientId("backend_subscriber")// hiểu như là tài khoản của BE trong hệ thống
                .Build();

            // ConnectedAsync => khi client connect ok thì chạy code trong này
            _client.ConnectedAsync += async e =>
            {
                /* đăng ký thành công tự động subscrice topic */
                await _client.SubscribeAsync("devices/announce");
                await _client.SubscribeAsync("devices/+/data");

                logger.LogInformation("Subscribed topics");
            };

            _client.ApplicationMessageReceivedAsync += HandleMessage;// Khi MQTT Client nhận được một message từ Broker thì gọi HandleMessage (tức khi nhận đc data từ esp thì chạy).

            await _client.ConnectAsync(options, stoppingToken);// Thiết lập kết nối TCP + MQTT session với broker, hiểu như là đag đăng nhập vào broker

            /* xử lý dừng ở while tức là cho hệ thống chay liên tục để đảm bảo puslish,..
             * và stoppingToken hay vì kiểu nếu sau bị dừng cho biên bản, môi trường deloy,... khiến app bị dừng thì
             * while lúc này nó sẽ là false và thoát lặp ko lắng nghe gì ko chạy liên tục nữa */
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(1000, stoppingToken);// stoppingToken hệ thống chưa yêu cầu dừng thì cứ mỗi 1 giây thức dậy một lần
            }   
        }

        /* ------------------------------------- XỬ LÝ CHÍNH ---------------------------------- */
              /* =============> backend nhận dữ liệu ESP gửi lên và xử lý <============= */
        private async Task HandleMessage(MqttApplicationMessageReceivedEventArgs e)
        {
            var topic = e.ApplicationMessage.Topic;// lấy topic
            var payload = e.ApplicationMessage.ConvertPayloadToString();// lấy payload (dữ liệu esp push lên)

            // Bọc toàn bộ logic trong try/catch: 1 message lỗi (sai JSON, mất kết nối DB...)
            // không được phép làm sập cả BackgroundService đang chạy nền xử lý mọi thiết bị.
            try
            {
                using var scope = scopeFactory.CreateScope();// Mỗi message tạo một DbContext mới để làm việc với db.
                var db = scope.ServiceProvider.GetRequiredService<DatabaseContext>();

                // ---------------- ANNOUNCE ----------------
                if (topic == "devices/announce")
                {
                    await HandleAnnounce(db, payload);
                    return;
                }

                // ---------------- SENSOR DATA ----------------
                await HandleSensorData(db, topic, payload);
            }
            catch (Exception ex)
            {
                // Log kèm topic để biết thiết bị nào gửi message gây lỗi, dễ debug ngoài thực tế.
                logger.LogError(ex, "Lỗi xử lý MQTT message từ topic {Topic}", topic);
            }
        }

        private async Task HandleAnnounce(DatabaseContext db, string payload)
        {
            var data = JsonSerializer.Deserialize<AnnouncePayload>(payload);// JSON -> Object
            if (data == null) return;

            var exists = await db.Devices.FirstOrDefaultAsync(x => x.MacAddress == data.Mac);
            if (exists != null) return;

            db.Devices.Add(new Device
            {
                MacAddress = data.Mac,
                IsClaimed = false, // thiết bị tự gán là false, sau user connect thì mới là true 
                CreatedAt = DateTime.UtcNow
            });

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Trường hợp 2 announce cùng MAC gửi gần như đồng thời (network retry, mất gói)
                // -> 2 request cùng pass qua check "exists == null" trước khi insert kịp commit.
                // Nếu cột MacAddress có unique constraint ở DB, đây sẽ là tuyến phòng thủ cuối,
                // record trùng bị DB từ chối thay vì tạo ra 2 device cho cùng 1 thiết bị vật lý.
                logger.LogWarning("Device {Mac} đã được insert bởi message khác, bỏ qua", data.Mac);
            }
        }

        private async Task HandleSensorData(DatabaseContext db, string topic, string payload)
        {
            var parts = topic.Split('/');
            var mac = parts[1];

            var device = await db.Devices.FirstOrDefaultAsync(x => x.MacAddress == mac);
            if (device == null) return;

            device.LastSeenAt = DateTime.UtcNow;// thiết bị vừa onl

            var sensor = JsonSerializer.Deserialize<SensorPayload>(payload);
            if (sensor == null) return;

            if (sensor.Alert)
            {
                var users = await db.Accounts
                    .Where(x => x.DeviceId == device.Id)
                    .ToListAsync();
                // lặp qua user của thiết bị đó và gửi cảnh báo
                foreach (var u in users)
                {
                    db.Notifications.Add(new Notification
                    {
                        DeviceId = device.Id,
                        UserId = u.Id,
                        Message = BuildMessage(sensor),
                        Type = sensor.Type,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await db.SaveChangesAsync();
        }

        // hàm tạo nội dung thông báo
        private string BuildMessage(SensorPayload s)
        {
            return s.Type switch
            {
                "gas" => $"Gas nguy hiểm: {s.Gas}",
                "temp_high" => $"Nhiệt độ cao: {s.Temperature}",
                "temp_low" => $"Nhiệt độ thấp: {s.Temperature}",
                _ => "Cảnh báo thiết bị"
            };
        }
    }
}