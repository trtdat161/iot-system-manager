using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

namespace IoT_system.Configurations.midleware
{
    // You may need to install the Microsoft.AspNetCore.Http.Abstractions package into your project
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext httpContext)// add async
        {

            try
            {
                await _next(httpContext);
            }
            catch (Exception ex) { 
                await HandleException(httpContext, ex);
            }
        }
        // tạo methed bắt lỗi toàn hệ thống (GIẢM VIỆC try catch)
        private static Task HandleException(HttpContext httpContext, Exception ex)
        {
            httpContext.Response.ContentType = "application/json";// response là json => Đây là header HTTP: Content - Type: application / json

            int statusCode = ex switch // switch expression (C# hiện đại)
            {
                ArgumentOutOfRangeException => StatusCodes.Status400BadRequest,// input sai
                KeyNotFoundException => StatusCodes.Status404NotFound,// không tìm thấy
                _ => StatusCodes.Status500InternalServerError// _ trường hợp còn lại lỗi hệ thống,...
            };

            // sau khi map xong thì gán lại statusCode cho response
            httpContext.Response.StatusCode = statusCode;
            return httpContext.Response.WriteAsJsonAsync(new // Ghi JSON xuống response body
            {
                status = statusCode,
                error = ex.Message
            });
        }
    }

    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class ExceptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseExceptionMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ExceptionMiddleware>();
        }
    }
}
