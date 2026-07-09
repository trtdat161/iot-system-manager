using IoT_system.DTOS.MQTT;
using IoT_system.Helper;
using IoT_system.Hubs;
using IoT_system.Models;
using Microsoft.AspNetCore.SignalR;
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
        private readonly IServiceScopeFactory scopeFactory;// Tạo “mini DI container” tạm thời để lấy service scoped hợp lệ
        private readonly ILogger<IotMqttIngestService> logger;
        private readonly IHubContext<NotificationHub> hubContext;// hub for realtime

        /* 
         * ILogger kiểu nó sẽ theo dõi toàn app, Dùng để biết:
         * có bao nhiêu message MQTT
         * data gửi lên có đúng không
         * hệ thống có đang sống không
         * ILogger -> Khi hệ thống crash, không phải đoán — log sẽ nói rõ lỗi gì.
         */

        private IMqttClient client;

        public IotMqttIngestService(
            IServiceScopeFactory _scopeFactory,
            ILogger<IotMqttIngestService> _logger,
            IHubContext<NotificationHub> _hubContext)

        {
            scopeFactory = _scopeFactory;
            logger = _logger;
            hubContext = _hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // khởi tạo mqtt client, đóng vai trò như “xưởng sản xuất” để tạo ra các thành phần MQTT
            var factory = new MqttFactory();
            client = factory.CreateMqttClient();

            var options = new MqttClientOptionsBuilder()
                .WithTcpServer("broker.hivemq.com", 1883)// đăng ký vào địa chỉ máy chủ, broker public
                .WithClientId("backend_subscriber")// hiểu như là tài khoản của BE trong hệ thống
                .Build();

            // ConnectedAsync => khi client connect ok thì chạy code trong này
            client.ConnectedAsync += async e =>
            {
                /* đăng ký thành công tự động subscrice topic */
                await client.SubscribeAsync("devices/announce");
                await client.SubscribeAsync("devices/+/data");

                logger.LogInformation("Subscribed topics");
            };

            client.ApplicationMessageReceivedAsync += HandleMessage;// Khi MQTT Client nhận được một message từ Broker thì gọi HandleMessage (tức khi nhận đc data từ esp thì chạy).

            await client.ConnectAsync(options, stoppingToken);// Thiết lập kết nối TCP + MQTT session với broker, hiểu như là đag đăng nhập vào broker

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
                logger.LogError(ex, "Error handling MQTT messages from topic {Topic}", topic);
            }
        }

        private async Task HandleAnnounce(DatabaseContext db, string payload)
        {
            // DTO AnnouncePayload
            var data = JsonSerializer.Deserialize<AnnouncePayload>(payload);// JSON -> Object
            if (data == null) return;

            var exists = await db.Devices.FirstOrDefaultAsync(x => x.MacAddress == data.Mac);
            if (exists != null) return;

            db.Devices.Add(new Device
            {
                MacAddress = data.Mac.ToUpperInvariant(), // chuẩn hóa ngay từ lúc lưu DB
                Name = $"Device_{data.Mac}",
                IsClaimed = false, // thiết bị tự gán là false, sau user connect thì mới là true 
                //CreatedAt = DateTime.UtcNow
                CreatedAt = TimeHelper.VnNow()// fix giờ
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
                logger.LogWarning("Device {Mac} This message has already been inserted by another message, ignore it.", data.Mac);
            }
        }

        private async Task HandleSensorData(DatabaseContext db, string topic, string payload)
        {
            var parts = topic.Split('/');
            var mac = parts[1].ToUpperInvariant(); // chuẩn hóa ngay từ đầu, dùng biến này xuyên suốt hàm;

            var device = await db.Devices
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MacAddress == mac);

            if (device == null)
            {
                logger.LogWarning("[SENSOR] not found device MAC: {Mac}", mac);
                return;
            }

            // Update LastSeenAt trực tiếp, không qua tracked object
            await db.Devices
                .Where(x => x.Id == device.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.LastSeenAt, TimeHelper.VnNow()));

            var sensor = JsonSerializer.Deserialize<SensorPayload>(payload);
            if (sensor == null)
            {
                logger.LogWarning("[SENSOR] Deserialize failed payload: {Payload}", payload);
                return;
            }

            logger.LogInformation("[SENSOR] MAC={Mac} type={Type} gas={Gas} alert={Alert}",
                mac, sensor.Type, sensor.Gas, sensor.Alert);

            // code mới thêm DHT11
            //bool hasDhtAlert = sensor.TempAlert || sensor.HumidLowAlert || sensor.HumidHighAlert;

            //if (sensor.Alert || hasDhtAlert)
            //{
            //    var userIds = await db.Accounts
            //        .Where(a => a.DeviceId == device.Id && a.DeletedAt == null)
            //        .Select(a => a.Id)
            //        .ToListAsync();

            //    logger.LogInformation("[SENSOR] Number of users will receive notification: {Count}", userIds.Count);

            //    var message = BuildMessage(sensor);
            //    var now = TimeHelper.VnNow();

            //    foreach (var userId in userIds)
            //    {
            //        await db.Database.ExecuteSqlRawAsync(
            //            "INSERT INTO [Notification] (DeviceId, UserId, Message, Type, IsRead, CreatedAt) VALUES ({0}, {1}, {2}, {3}, {4}, {5})",
            //            device.Id, userId, message, sensor.Type, false, now
            //        );
            //    }
            //}

            // ============ 1. LUÔN BẮN TRẠNG THÁI HIỆN TẠI - MỖI LẦN ESP GỬI LÊN ============
            // Không cần check Alert hay không, cứ có data mới là bắn để UI luôn "sống"
            await hubContext.Clients.Group(mac).SendAsync("ReceiveSensorData", new
            {
                Mac = mac,
                DeviceId = device.Id,
                Type = sensor.Type,          // "gas" hoặc "dht11" tùy loại payload gửi lên
                Gas = sensor.Gas,
                Temperature = sensor.Temperature,
                Humidity = sensor.Humidity,
                Timestamp = TimeHelper.VnNow()
            });

            // ============ 2. CHỈ BẮN CẢNH BÁO KHI VƯỢT NGƯỠNG ============
            bool hasDhtAlert = sensor.TempAlert || sensor.HumidLowAlert || sensor.HumidHighAlert;

            if (sensor.Alert || hasDhtAlert)
            {
                var userIds = await db.Accounts
                    .Where(a => a.DeviceId == device.Id && a.DeletedAt == null)
                    .Select(a => a.Id)
                    .ToListAsync();

                var message = BuildMessage(sensor);
                var now = TimeHelper.VnNow();

                foreach (var userId in userIds)
                {
                    await db.Database.ExecuteSqlRawAsync(
                        "INSERT INTO [Notification] (DeviceId, UserId, Message, Type, IsRead, CreatedAt) VALUES ({0}, {1}, {2}, {3}, {4}, {5})",
                        device.Id, userId, message, sensor.Type, false, now
                    );
                }

                // Bắn realtime cảnh báo riêng, khác event với data thường
                await hubContext.Clients.Group(mac).SendAsync("ReceiveAlert", new
                {
                    Mac = mac,
                    DeviceId = device.Id,
                    Message = message,
                    Type = sensor.Type,
                    CreatedAt = now
                });
            }
        }

        private string BuildMessage(SensorPayload s)
        {
            return s.Type switch
            {
                // GAS
                "gas" => $"gas! value: {s.Gas}",
                "gas_danger" => $"Warning! Gas level exceeded! : { s.Gas}",
                // DHT11
                _ when s.TempAlert => $"hot air ! :{s.Temperature}°C",
                _ when s.HumidLowAlert => $"dry air ! :{s.Humidity}%",
                _ when s.HumidHighAlert => $"damp ! :{s.Humidity}%",
                _ => "device warning"
            };
        }
    }
}