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
using System.Collections.Concurrent;   


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

        // ===== CÁC LOẠI CẢNH BÁO (cũng là giá trị lưu vào cột Notification.Type) =====
        private static readonly string[] GasKinds = { "gas", "gas_danger" };
        private static readonly string[] DhtKinds = { "temp_high", "humid_low", "humid_high" };

        /* Sổ "đợt cảnh báo" đang diễn ra, lưu trong RAM:
         *   Key   = (DeviceId, loại cảnh báo)
         *   Value = các userId đã được xử lý trong đợt này (đã báo, hoặc đang có tin chưa đọc)
         * Có key  => đợt đang diễn ra (sensor vẫn vượt ngưỡng)
         * Mất key => sensor đã về bình thường, lần vượt ngưỡng sau là đợt mới
         * Dùng ConcurrentDictionary vì service này là singleton. */
        private readonly ConcurrentDictionary<(int DeviceId, string Kind), ConcurrentDictionary<int, byte>> incidents = new();

        public IotMqttIngestService(
            IServiceScopeFactory _scopeFactory,
            ILogger<IotMqttIngestService> _logger,
            IHubContext<NotificationHub> _hubContext
            )

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

            db.Devices.Add(new Device // tự động thêm vào db device mới online 
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
            var mac = parts[1].ToUpperInvariant();

            var device = await db.Devices
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MacAddress == mac);

            if (device == null)
            {
                logger.LogWarning("[SENSOR] not found device MAC: {Mac}", mac);
                return;
            }

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

            // ============ 1. LUÔN BẮN TRẠNG THÁI HIỆN TẠI - MỖI LẦN ESP GỬI LÊN ============
            // Type: "gas" | "gas_danger" | "heartbeat" (phần gas của payload)
            await hubContext.Clients.Group(mac).SendAsync("ReceiveSensorData", new
            {
                Mac = mac,
                DeviceId = device.Id,
                Type = sensor.Type,
                Gas = sensor.Gas,
                Temperature = sensor.Temperature,
                Humidity = sensor.Humidity,
                Timestamp = TimeHelper.VnNow()
            });

            // ============ 2. XỬ LÝ CẢNH BÁO (tách loại + tách user) ============
            await ProcessAlerts(db, device.Id, mac, sensor);
        }

        /// <summary>
        /// ESP gửi 1 payload chứa cả gas lẫn DHT11, nên mỗi payload xử lý cả 2 phần.
        /// Bước 1: xác định loại nào đang vượt ngưỡng, loại nào đã bình thường (reset đợt).
        /// Bước 2: với mỗi loại đang vượt ngưỡng -> thông báo cho từng user.
        /// </summary>
        private async Task ProcessAlerts(DatabaseContext db, int deviceId, string mac, SensorPayload sensor)
        {
            var activeKinds = new List<string>();   // các loại đang vượt ngưỡng

            // ----- GAS: type = "gas" | "gas_danger" khi alert = true, "heartbeat" khi bình thường -----
            string? gasType = sensor.Type;
            bool gasAlert = sensor.Alert && gasType != null && GasKinds.Contains(gasType);
            if (gasAlert) activeKinds.Add(gasType!);

            // ----- DHT11: 3 điều kiện độc lập -----
            if (sensor.TempAlert) activeKinds.Add("temp_high");
            if (sensor.HumidLowAlert) activeKinds.Add("humid_low");
            if (sensor.HumidHighAlert) activeKinds.Add("humid_high");

            // Loại DHT nào không còn vượt ngưỡng -> kết thúc đợt
            IEnumerable<string> kindsToReset = DhtKinds.Except(activeKinds);

            // Gas chỉ reset khi về HẲN bình thường (alert = false).
            // Nếu chỉ dao động giữa "gas" và "gas_danger" thì giữ nguyên đợt,
            // user đã xác nhận không bị báo lại.
            if (!gasAlert) kindsToReset = kindsToReset.Concat(GasKinds);

            foreach (var kind in kindsToReset)
            {
                incidents.TryRemove((deviceId, kind), out _);
            }

            foreach (var kind in activeKinds)
            {
                await NotifyUsers(db, deviceId, mac, sensor, kind);
            }
        }

        /// <summary>
        /// Thông báo 1 loại cảnh báo cho các user của thiết bị, xét TỪNG USER:
        ///  - user đã được xử lý trong đợt này           -> bỏ qua
        ///  - user còn thông báo CHƯA ĐỌC cùng loại      -> bỏ qua (không chồng)
        ///  - còn lại                                    -> insert DB + realtime
        /// </summary>
        private async Task NotifyUsers(DatabaseContext db, int deviceId, string mac, SensorPayload sensor, string kind)
        {
            var handledUsers = incidents.GetOrAdd((deviceId, kind), _ => new ConcurrentDictionary<int, byte>());

            var userIds = await db.Accounts
                .AsNoTracking()
                .Where(a => a.DeviceId == deviceId && a.DeletedAt == null)
                .Select(a => a.Id)
                .ToListAsync();

            // User chưa được xử lý trong đợt này.
            // Khi mọi người đã được xử lý -> rỗng -> return, không đụng DB thêm.
            var pending = userIds.Where(id => !handledUsers.ContainsKey(id)).ToList();
            if (pending.Count == 0) return;

            // Check chưa đọc THEO TỪNG USER (không chỉ theo thiết bị)
            var hasUnreadUserIds = await db.Notifications
                .AsNoTracking()
                .Where(n => n.DeviceId == deviceId
                         && n.Type == kind
                         && n.IsRead == false
                         && pending.Contains(n.UserId))
                .Select(n => n.UserId)
                .Distinct()
                .ToListAsync();

            var targets = pending.Except(hasUnreadUserIds).ToList();

            if (targets.Count > 0)
            {
                var message = BuildMessage(kind, sensor);
                var now = TimeHelper.VnNow(); // dùng chung 1 mốc để HistoryDetail gom đúng người nhận

                foreach (var userId in targets)
                {
                    await db.Database.ExecuteSqlRawAsync(
                        "INSERT INTO [Notification] (DeviceId, UserId, Message, Type, IsRead, CreatedAt) VALUES ({0}, {1}, {2}, {3}, {4}, {5})",
                        deviceId, userId, message, kind, false, now);
                }

                await hubContext.Clients.Group(mac).SendAsync("ReceiveAlert", new
                {
                    Mac = mac,
                    DeviceId = deviceId,
                    Message = message,
                    Type = kind,
                    CreatedAt = now,
                    UserIds = targets   // frontend dùng để lọc đúng người nhận
                });
            }

            // Đánh dấu SAU khi insert thành công. Nếu insert lỗi thì tin kế tiếp sẽ thử lại.
            foreach (var id in pending)
            {
                handledUsers.TryAdd(id, 0);
            }
        }

        private static string BuildMessage(string kind, SensorPayload s) => kind switch
        {
            "gas" => $"Gas detected! Value: {s.Gas}",
            "gas_danger" => $"Warning! Gas level exceeded! Value: {s.Gas}",
            "temp_high" => $"Hot air! {s.Temperature}°C",
            "humid_low" => $"Dry air! {s.Humidity}%",
            "humid_high" => $"Damp air! {s.Humidity}%",
            _ => "Device warning"
        };
    }
}