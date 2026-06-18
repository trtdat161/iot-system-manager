using IoT_system.Configurations.jwt;
using IoT_system.Configurations.midleware;
using IoT_system.Configurations.mqtt;
using IoT_system.Models;
using IoT_system.Profiles;
using IoT_system.Services.Accounts;
using IoT_system.Services.DashboardAdmin;
using IoT_system.Services.Devices;
using IoT_system.Services.Languages;
using IoT_system.Services.Mqtt;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

/* ======================================== BUILDER ==================================== */
var builder = WebApplication.CreateBuilder(args);

/* đăng ký mqtt services, MQTT client là luồng kết nối dài (persistent connection), 
không tạo đi tạo lại cho mỗi request là lý do dùng AddSingleton */
builder.Services.AddSingleton<MqttClient>();

// add cors policy để sau này FE gọi được
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173" // dev FE
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // nếu có JWT cookie / auth
    });
});

var connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"];
builder.Services.AddDbContext<DatabaseContext>(option => option.UseLazyLoadingProxies().UseSqlServer(connectionString));

// khai báo web api để sau dùng các services
builder.Services.AddControllers();


// services dưới đây ...
builder.Services.AddHttpContextAccessor();
builder.Services.AddJwtAuthentication(builder.Configuration);// gọi vào toàn bộ các cấu hình trong JwtServicesExtensions
builder.Services.AddScoped<AccountServices, AccountServicesImpl>();
builder.Services.AddScoped<LanguageServices, LanguageServiceImpl>();
builder.Services.AddScoped<DeviceServices, DeviceServiceImpl>();
builder.Services.AddScoped<DashboardAdminServices, DashboardAdminServicesImpl>();
// DI của mqtt IoT dùng Singleton vì chỉ cần 1 connection toàn app, giữ kết nối lâu dài
builder.Services.AddSingleton<MqttClient>();


// khai báo DTO
builder.Services.AddAutoMapper(typeof(MappingProfiles));
/* ======================================== APP ==================================== */

builder.Services.AddSingleton<MqttClient>();
builder.Services.AddHostedService<IotMqttIngestService>();
var app = builder.Build();
// enable cors
app.UseCors("ReactApp");
var mqtt = app.Services.GetRequiredService<MqttClient>();
await mqtt.ConnectAsync("broker.hivemq.com", 1883);

/* midleware */
app.UseExceptionMiddleware();

/* jwt */
app.UseAuthentication();// use xác thực
app.UseAuthorization();// use phân quyền

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action}"
);
app.Run();
