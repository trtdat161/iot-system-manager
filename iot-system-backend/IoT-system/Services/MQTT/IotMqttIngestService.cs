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
using IoT_system.DTOS.Mail;
using IoT_system.Services.Mail;
using System.Net;


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
        private readonly MailQueueService mailQueue;


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
        private readonly ConcurrentDictionary<(int DeviceId, string Kind), ConcurrentDictionary<int, DateTime>> incidents = new();

        /* Số lần cảnh báo theo thiết bị và loại, tiếp tục khi còn thông báo chưa đọc.
         * LƯU Ý: đây là bộ đếm cấp THIẾT BỊ (chung cho cả nhà) -> chỉ dùng cho admin và để biết "loại này đang active".
         * Số hiển thị cho từng user lấy từ cột Notification.AlertCount của chính dòng thông báo của user đó. */
        private const int AlertCountIntervalSeconds = 30;
        private readonly ConcurrentDictionary<(int DeviceId, string Kind), DateTime> lastCountedAt = new();

        private readonly ConcurrentDictionary<(int DeviceId, string Kind), int> alertCounts = new();
        private readonly ConcurrentDictionary<(int DeviceId, string Kind), bool> hasUnreadNotifications = new();
        private const int DeviceOnlineWindowSeconds = 30;

        private static readonly Dictionary<string, TimeSpan> ReminderIntervals = new Dictionary<string, TimeSpan>
        {
            { "gas_danger", TimeSpan.FromMinutes(1) },
            { "gas", TimeSpan.FromMinutes(1) },
            { "temp_high", TimeSpan.FromMinutes(1) },
            { "humid_low", TimeSpan.FromMinutes(1) },
            { "humid_high", TimeSpan.FromMinutes(1) }
        };
        private static readonly TimeSpan DefaultReminderInterval = TimeSpan.FromMinutes(15);

        public IotMqttIngestService(
            IServiceScopeFactory _scopeFactory,
            ILogger<IotMqttIngestService> _logger,
            IHubContext<NotificationHub> _hubContext,
            MailQueueService _mailQueue
            )

        {
            scopeFactory = _scopeFactory;
            logger = _logger;
            hubContext = _hubContext;
            mailQueue = _mailQueue;
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

            // Tin retained là tin cũ broker phát lại lúc vừa subscribe, không phải dữ liệu realtime
            if (e.ApplicationMessage.Retain)
            {
                logger.LogInformation("Ignore retained message from topic {Topic}", topic);
                return;
            }

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
            var existingDevice = await db.Devices
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MacAddress == mac);
            var updated = await db.Devices
                .Where(x => x.MacAddress == mac)
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.LastSeenAt, now));

            if (updated > 0)
            {
                if (!IsDeviceOnline(existingDevice?.LastSeenAt, now))
                {
                    await NotifyAdminsDeviceStatus(mac);
                }

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
                return;
            }

            await NotifyAdminsDeviceStatus(mac);
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

            var now = TimeHelper.VnNow();
            var wasOffline = !IsDeviceOnline(device.LastSeenAt, now);
            await db.Devices
                .Where(x => x.Id == device.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.LastSeenAt, now));

            var sensor = JsonSerializer.Deserialize<SensorPayload>(payload);
            if (sensor == null)
            {
                logger.LogWarning("[SENSOR] Deserialize failed payload: {Payload}", payload);
                return;
            }

            logger.LogInformation("[SENSOR] MAC={Mac} type={Type} gas={Gas} alert={Alert}",
                mac, sensor.Type, sensor.Gas, sensor.Alert);

            // ============ 1. CẬP NHẬT SỔ ĐỢT CẢNH BÁO + TẠO THÔNG BÁO CHO USER ============
            // Type: "gas" | "gas_danger" | "heartbeat" (phần gas của payload)
            var result = await UpdateIncidents(db, device.Id, sensor);

            var newNotificationCounts = new Dictionary<string, int>();
            var newNotificationUserIds = new Dictionary<string, List<int>>();
            foreach (var kind in result.activeKinds)
            {
                var notificationResult = await NotifyUsers(db, device.Id, mac, sensor, kind);
                newNotificationCounts[kind] = notificationResult.count;
                newNotificationUserIds[kind] = notificationResult.userIds;
            }

            await SaveAlertCounts(db, device.Id, newNotificationUserIds, result.countedKinds);

            // ============ 2. LUÔN BẮN TRẠNG THÁI HIỆN TẠI - MỖI LẦN ESP GỬI LÊN ============
            // Gửi SAU khi insert + cộng AlertCount xong để NotificationCounts là số mới nhất của từng dòng thông báo.
            // AlertCounts (cấp thiết bị) chỉ còn để FE biết loại nào đang active; số hiển thị cho user lấy từ NotificationCounts.
            var notificationCounts = await GetUnreadAlertCounts(db, device.Id, result.activeKinds);

            await hubContext.Clients.Group(mac).SendAsync("ReceiveSensorData", new
            {
                Mac = mac,
                DeviceId = device.Id,
                Type = sensor.Type,
                Gas = sensor.Gas,
                Temperature = sensor.Temperature,
                Humidity = sensor.Humidity,
                Timestamp = TimeHelper.VnNow(),
                AlertCounts = result.counts,
                NotificationCounts = notificationCounts
            });

            foreach (var kind in result.activeKinds)
            {
                await hubContext.Clients.Group(NotificationHub.AdminGroup).SendAsync("ReceiveAdminAlert", new
                {
                    Mac = mac,
                    DeviceId = device.Id,
                    Message = BuildMessage(kind, sensor),
                    Type = kind,
                    CreatedAt = TimeHelper.VnNow(),
                    AlertCount = result.counts[kind],
                    NewNotificationCount = newNotificationCounts[kind]
                });
            }

            if (wasOffline)
            {
                await NotifyAdminsDeviceStatus(mac);
            }
        }

        private static bool IsDeviceOnline(DateTime? lastSeenAt, DateTime now) =>
            lastSeenAt.HasValue &&
            lastSeenAt.Value >= now.AddSeconds(-DeviceOnlineWindowSeconds);

        private Task NotifyAdminsDeviceStatus(string mac) =>
            hubContext.Clients.Group(NotificationHub.AdminGroup).SendAsync(
                "ReceiveDeviceStatus",
                new { MacAddress = mac });

        private async Task<(List<string> activeKinds, Dictionary<string, int> counts, List<string> countedKinds)> UpdateIncidents(
    DatabaseContext db,
    int deviceId,
    SensorPayload sensor)
        {
            var now = TimeHelper.VnNow(); // MỚI
            var activeKinds = new List<string>();
            var countedKinds = new List<string>(); // MỚI: các loại được cộng số đếm ở lượt này

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
                hasUnreadNotifications.TryRemove((deviceId, kind), out _);
                lastCountedAt.TryRemove((deviceId, kind), out _); // MỚI
            }

            var counts = new Dictionary<string, int>();
            foreach (var kind in activeKinds)
            {
                var key = (deviceId, kind);
                if (alertCounts.ContainsKey(key)
                    && hasUnreadNotifications.TryGetValue(key, out var previouslyHadUnread)
                    && previouslyHadUnread)
                {
                    var stillHasUnread = await db.Notifications
                        .AsNoTracking()
                        .AnyAsync(n => n.DeviceId == deviceId
                                    && n.Type == kind
                                    && n.IsRead == false);

                    if (!stillHasUnread)
                    {
                        alertCounts[key] = 0;
                        hasUnreadNotifications[key] = false;
                    }
                }

                if (!alertCounts.ContainsKey(key))
                {
                    var persistedCount = await db.Notifications
                        .AsNoTracking()
                        .Where(n => n.DeviceId == deviceId
                                 && n.Type == kind
                                 && n.IsRead == false)
                        .Select(n => (int?)n.AlertCount)
                        .MaxAsync() ?? 0;

                    alertCounts.TryAdd(key, persistedCount);
                    hasUnreadNotifications.TryAdd(key, persistedCount > 0);
                }

                // MỚI: chỉ cộng khi tới nhịp, chưa tới thì giữ nguyên số hiện tại
                if (ShouldCount(key, now))
                {
                    counts[kind] = alertCounts.AddOrUpdate(key, 1, (key, old) => old + 1);
                    countedKinds.Add(kind);
                }
                else
                {
                    int currentCount;
                    alertCounts.TryGetValue(key, out currentCount);
                    counts[kind] = currentCount > 0 ? currentCount : 1; // đang active thì tối thiểu là 1
                }
            }

            return (activeKinds, counts, countedKinds); // MỚI: thêm countedKinds
        }

        private async Task<(int count, List<int> userIds)> NotifyUsers(
    DatabaseContext db,
    int deviceId,
    string mac,
    SensorPayload sensor,
    string kind)
        {
            var handledUsers = incidents.GetOrAdd((deviceId, kind), _ => new ConcurrentDictionary<int, DateTime>());
            var now = TimeHelper.VnNow(); // dùng chung 1 mốc để HistoryDetail gom đúng người nhận
            var reminderInterval = GetReminderInterval(kind);

            var userIds = await db.Accounts
                .AsNoTracking()
                .Where(a => a.DeviceId == deviceId && a.DeletedAt == null)
                .Select(a => a.Id)
                .ToListAsync();

            // Bước 1 (chỉ dùng RAM): user chưa được báo, hoặc đã quá chu kỳ kể từ mốc gần nhất
            var pending = userIds.Where(id => NeedsAlert(handledUsers, id, now, reminderInterval)).ToList();
            if (pending.Count == 0) return (0, new List<int>());

            // Bước 2 (chạy DB, chỉ khi tới hạn nhắc): user nào vừa bấm đã đọc trong vòng 1 chu kỳ
            // thì hoãn, và chu kỳ mới tính từ lúc bấm. Chỉ áp dụng cho user đã được báo trong đợt này,
            // user mới của đợt vẫn được báo ngay.
            var reminderUserIds = pending.Where(id => handledUsers.ContainsKey(id)).ToList();
            if (reminderUserIds.Count > 0)
            {
                var readSince = now - reminderInterval;

                var recentReads = await db.Notifications
                    .AsNoTracking()
                    .Where(n => n.DeviceId == deviceId
                             && n.Type == kind
                             && n.ReadAt != null
                             && n.ReadAt > readSince
                             && reminderUserIds.Contains(n.UserId))
                    .GroupBy(n => n.UserId)
                    .Select(group => new { UserId = group.Key, LastReadAt = group.Max(n => n.ReadAt) })
                    .ToListAsync();

                foreach (var read in recentReads)
                {
                    if (read.LastReadAt.HasValue)
                    {
                        handledUsers[read.UserId] = read.LastReadAt.Value; // dời mốc sang lúc bấm
                        pending.Remove(read.UserId);
                    }
                }

                if (pending.Count == 0) return (0, new List<int>());
            }

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
            if (targets.Count > 0 || hasUnreadUserIds.Count > 0)
            {
                hasUnreadNotifications[(deviceId, kind)] = true;
            }

            var message = BuildMessage(kind, sensor);

            if (targets.Count > 0)
            {
                foreach (var userId in targets)
                {
                    await db.Database.ExecuteSqlRawAsync(
                        "INSERT INTO [Notification] (DeviceId, UserId, Message, Type, IsRead, CreatedAt, AlertCount) VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                        deviceId, userId, message, kind, false, now, 1);
                }

                var newRows = await db.Notifications
                    .AsNoTracking()
                    .Where(n => n.DeviceId == deviceId
                             && n.Type == kind
                             && n.IsRead == false
                             && targets.Contains(n.UserId))
                    .Select(n => new { n.Id, n.UserId })
                    .ToListAsync();

                foreach (var row in newRows)
                {
                    await hubContext.Clients.Group(mac).SendAsync("ReceiveAlert", new
                    {
                        Id = row.Id,
                        Mac = mac,
                        DeviceId = deviceId,
                        Message = message,
                        Type = kind,
                        CreatedAt = now,
                        AlertCount = 1,
                        UserIds = new List<int> { row.UserId }
                    });
                }
            }

            // Email: gửi cho TẤT CẢ user còn lại trong pending
            await EnqueueEmails(db, pending, mac, message, now);

            // MỚI: vừa gửi thông báo/email nên lần cộng số đếm kế tiếp phải cách đây đủ AlertCountIntervalSeconds
            lastCountedAt[(deviceId, kind)] = now;

            // Ghi lại thời điểm báo
            foreach (var id in pending)
            {
                handledUsers[id] = now;
            }

            return (targets.Count, targets);
        }

        private static TimeSpan GetReminderInterval(string kind)
        {
            TimeSpan interval;
            if (ReminderIntervals.TryGetValue(kind, out interval))
            {
                return interval;
            }

            return DefaultReminderInterval;
        }

        // Cần báo khi: user chưa được báo trong đợt này, hoặc lần báo gần nhất đã quá chu kỳ
        private static bool NeedsAlert(
            ConcurrentDictionary<int, DateTime> handledUsers,
            int userId,
            DateTime now,
            TimeSpan reminderInterval)
        {
            DateTime lastAlertedAt;
            if (!handledUsers.TryGetValue(userId, out lastAlertedAt))
            {
                return true;
            }

            return now - lastAlertedAt >= reminderInterval;
        }

        private bool ShouldCount((int DeviceId, string Kind) key, DateTime now)
        {
            DateTime lastCounted;
            if (!lastCountedAt.TryGetValue(key, out lastCounted))
            {
                lastCountedAt[key] = now;
                return true;
            }

            if ((now - lastCounted).TotalSeconds >= AlertCountIntervalSeconds)
            {
                lastCountedAt[key] = now;
                return true;
            }

            return false;
        }

        // Mỗi user tiếp tục đếm trên thông báo chưa đọc riêng; thông báo vừa tạo bắt đầu từ 1.
        // Mỗi user tiếp tục đếm trên thông báo chưa đọc riêng; thông báo vừa tạo bắt đầu từ 1.
        // Chỉ cộng cho các loại nằm trong countedKinds (đã tới nhịp AlertCountIntervalSeconds).
        private async Task SaveAlertCounts(
            DatabaseContext db,
            int deviceId,
            Dictionary<string, List<int>> newNotificationUserIds,
            List<string> countedKinds)
        {
            foreach (var item in newNotificationUserIds)
            {
                string kind = item.Key;
                var usersWithNewNotifications = item.Value;

                // MỚI: chưa tới nhịp đếm thì bỏ qua loại này
                if (!countedKinds.Contains(kind)) continue;

                var latestUnreadNotificationIds = await db.Notifications
                    .Where(n => n.DeviceId == deviceId
                             && n.Type == kind
                             && !n.IsRead
                             && !usersWithNewNotifications.Contains(n.UserId))
                    .GroupBy(n => n.UserId)
                    .Select(group => group.Max(n => n.Id))
                    .ToListAsync();

                if (latestUnreadNotificationIds.Count == 0) continue;

                await db.Notifications
                    .Where(n => latestUnreadNotificationIds.Contains(n.Id))
                    .ExecuteUpdateAsync(s => s.SetProperty(n => n.AlertCount, n => n.AlertCount + 1));
            }
        }

        // Số lần cảnh báo hiện tại của TỪNG dòng thông báo chưa đọc (Key = Notification.Id, Value = AlertCount).
        // Mỗi user có dòng riêng với số đếm riêng, FE chỉ lấy đúng dòng của mình theo Id.
        private async Task<Dictionary<int, int>> GetUnreadAlertCounts(
            DatabaseContext db,
            int deviceId,
            List<string> activeKinds)
        {
            var result = new Dictionary<int, int>();
            if (activeKinds.Count == 0)
            {
                return result;
            }

            var rows = await db.Notifications
                .AsNoTracking()
                .Where(n => n.DeviceId == deviceId
                         && n.IsRead == false
                         && activeKinds.Contains(n.Type))
                .Select(n => new { n.Id, n.AlertCount })
                .ToListAsync();

            foreach (var row in rows)
            {
                result[row.Id] = row.AlertCount;
            }

            return result;
        }

        // Lấy email của các user vừa được insert thông báo, rồi bỏ từng thư vào hàng đợi
        private async Task EnqueueEmails(DatabaseContext db, List<int> userIds, string mac, string message, DateTime time)
        {
            try
            {
                var emails = await db.Accounts
                    .AsNoTracking()
                    .Where(a => userIds.Contains(a.Id) && a.Email != null && a.Email != "")
                    .Select(a => a.Email)
                    .ToListAsync();

                foreach (var email in emails)
                {
                    var mail = new EmailMessageDtos
                    {
                        To = email,
                        Subject = $"[IoT System] Cảnh báo từ thiết bị {mac}",
                        HtmlBody = BuildEmailBody(mac, message, time)
                    };

                    if (!mailQueue.Enqueue(mail))
                    {
                        logger.LogWarning("Mail queue is full, dropped email to {To}", email);
                    }
                }
            }
            catch (Exception ex)
            {
                // Lỗi email không được phép làm hỏng luồng thông báo chính
                logger.LogError(ex, "Failed to enqueue alert emails for device {Mac}", mac);
            }
        }

        private static string BuildEmailBody(string mac, string message, DateTime time)
        {
            return $@"
            <div style='font-family:Arial,sans-serif;max-width:480px'>
                <h2 style='color:#d9534f'>Cảnh báo từ thiết bị</h2>
                <p><b>{WebUtility.HtmlEncode(message)}</b></p>
                <p>Thiết bị: {WebUtility.HtmlEncode(mac)}<br/>
                   Thời gian: {time:HH:mm:ss dd/MM/yyyy}</p>
                <p style='color:#888'>Email tự động từ DTECH SYSTEM (TTD).</p>
            </div>";
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
