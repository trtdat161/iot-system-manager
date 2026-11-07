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
        /* Đếm số lần ESP push lên trong đợt cảnh báo đang diễn ra.
         * Reset (TryRemove) cùng lúc với incidents khi sensor về bình thường. */
        private readonly ConcurrentDictionary<(int DeviceId, string Kind), int> alertCounts = new();

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
            var factory = new MqttFactory();
            client = factory.CreateMqttClient();

            var options = new MqttClientOptionsBuilder()
                .WithTcpServer("broker.hivemq.com", 1883)
                .WithClientId("backend_subscriber_" + Guid.NewGuid().ToString("N"))
                .Build();

            client.ConnectedAsync += async e =>
            {
                await client.SubscribeAsync("devices/announce");
                await client.SubscribeAsync("devices/+/data");

                logger.LogInformation("Subscribed topics");
            };

            client.DisconnectedAsync += e =>
            {
                logger.LogWarning("MQTT subscriber disconnected. Reason: {Reason}", e.Reason);
                return Task.CompletedTask;
            };

            client.ApplicationMessageReceivedAsync += HandleMessage;

            while (!stoppingToken.IsCancellationRequested)
            {
                if (!client.IsConnected)
                {
                    try
                    {
                        await client.ConnectAsync(options, stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "MQTT subscriber connect failed, retry in 5s");
                    }
                }

                await Task.Delay(5000, stoppingToken);
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
            var data = JsonSerializer.Deserialize<AnnouncePayload>(payload);
            if (data == null || string.IsNullOrWhiteSpace(data.Mac))
            {
                return;
            }

            var mac = data.Mac.ToUpperInvariant();
            var now = TimeHelper.VnNow();

            // Device đã có trong DB: chỉ cập nhật LastSeenAt rồi thoát
            var updated = await db.Devices
                .Where(x => x.MacAddress == mac)
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.LastSeenAt, now));

            if (updated > 0)
            {
                return;
            }

            // Device mới: thêm vào DB
            db.Devices.Add(new Device
            {
                MacAddress = mac,
                Name = $"Device_{mac}",
                IsClaimed = false,
                CreatedAt = now,
                LastSeenAt = now
            });

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                logger.LogWarning("Device {Mac} This message has already been inserted by another message, ignore it.", mac);
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
            var result = UpdateIncidents(device.Id, sensor);

            await hubContext.Clients.Group(mac).SendAsync("ReceiveSensorData", new
            {
                Mac = mac,
                DeviceId = device.Id,
                Type = sensor.Type,
                Gas = sensor.Gas,
                Temperature = sensor.Temperature,
                Humidity = sensor.Humidity,
                Timestamp = TimeHelper.VnNow(),
                AlertCounts = result.counts
            });

            foreach (var kind in result.activeKinds)
            {
                await NotifyUsers(db, device.Id, mac, sensor, kind);
            }
            await SaveAlertCounts(db, device.Id, result.counts);
        }

        private (List<string> activeKinds, Dictionary<string, int> counts) UpdateIncidents(int deviceId, SensorPayload sensor)
        {
            var activeKinds = new List<string>();

            string? gasType = sensor.Type;
            bool gasAlert = sensor.Alert && gasType != null && GasKinds.Contains(gasType);
            if (gasAlert) activeKinds.Add(gasType!);

            if (sensor.TempAlert) activeKinds.Add("temp_high");
            if (sensor.HumidLowAlert) activeKinds.Add("humid_low");
            if (sensor.HumidHighAlert) activeKinds.Add("humid_high");

            IEnumerable<string> kindsToReset = DhtKinds.Except(activeKinds);
            if (!gasAlert) kindsToReset = kindsToReset.Concat(GasKinds);

            foreach (var kind in kindsToReset)
            {
                incidents.TryRemove((deviceId, kind), out _);
                alertCounts.TryRemove((deviceId, kind), out _);
            }

            var counts = new Dictionary<string, int>();
            foreach (var kind in activeKinds)
            {
                counts[kind] = alertCounts.AddOrUpdate((deviceId, kind), 1, (key, old) => old + 1);
            }

            return (activeKinds, counts);
        }

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

        // update thông báo từng lần esp push lên
        private async Task SaveAlertCounts(DatabaseContext db, int deviceId, Dictionary<string, int> counts)
        {
            foreach (var item in counts)
            {
                string kind = item.Key;
                int count = item.Value;

                // Chỉ cập nhật thông báo CHƯA ĐỌC, chỉ tăng không giảm
                await db.Notifications
                    .Where(n => n.DeviceId == deviceId
                             && n.Type == kind
                             && n.IsRead == false
                             && n.AlertCount < count)
                    .ExecuteUpdateAsync(s => s.SetProperty(n => n.AlertCount, count));
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