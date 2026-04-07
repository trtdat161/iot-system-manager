using IoT_system.Converters;
using IoT_system.Models;
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
builder.Services.AddControllers().AddJsonOptions(option =>
{
    option.JsonSerializerOptions.Converters.Add(new DateConverters()); // my function convert
});
var connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"];
builder.Services.AddDbContext<DatabaseContext>(option => option.UseLazyLoadingProxies().UseSqlServer(connectionString));

// khai báo web api để sau dùng các services
builder.Services.AddControllers();

// services dưới đây ...


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
app.UseSession();// cho phep dung session cho session len truoc midlewar thi moi co ma sai

// ------- su dung midleware -------
//app.UseMiddleware<>();// dua security len tren dau

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action}"
);
app.Run();
