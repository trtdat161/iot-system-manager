using IoT_system.Configurations.jwt;
using IoT_system.Models;
using IoT_system.Profiles;
using IoT_system.Services.Accounts;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

/* ======================================== BUILDER ==================================== */
var builder = WebApplication.CreateBuilder(args);
// add cors policy để sau này FE gọi được
builder.Services.AddCors(option =>
{
    option.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http:...")// demo tạm, lấy url FE js
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"];
builder.Services.AddDbContext<DatabaseContext>(option => option.UseLazyLoadingProxies().UseSqlServer(connectionString));

// khai báo web api để sau dùng các services
builder.Services.AddControllers();

builder.Services.AddLocalization(options =>
{
    options.ResourcesPath = "Resources";
});

// services dưới đây ...
builder.Services.AddHttpContextAccessor();
builder.Services.AddJwtAuthentication(builder.Configuration);// gọi vào toàn bộ các cấu hình trong JwtServicesExtensions
builder.Services.AddScoped<AccountServices, AccountServicesImpl>();


// khai báo DTO
builder.Services.AddAutoMapper(typeof(MappingProfiles));
/* ======================================== APP ==================================== */

var app = builder.Build();
// enable cors
app.UseCors();

// khai bao ngon ngu
var cultures = new CultureInfo[]
{
    // vi-VN, en-US, (tạo mảng chưa chứa 2 ngôn ngữ)
    new CultureInfo("vi-VN"),
    new CultureInfo("en-US"),
};
app.UseRequestLocalization(new RequestLocalizationOptions
{
    // cau hinh ngon ngu mac dinh
    DefaultRequestCulture = new RequestCulture(cultures[0]),
    SupportedCultures = cultures,
    SupportedUICultures = cultures
});
/* jwt */
app.UseAuthentication();// use xác thực
app.UseAuthorization();// use phân quyền

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action}"
);
app.Run();
