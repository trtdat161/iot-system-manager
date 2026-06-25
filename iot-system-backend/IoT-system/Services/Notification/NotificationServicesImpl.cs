//using AutoMapper;
//using CaiderProject.Authen;
//using IoT_system.Configurations.jwt;
//using IoT_system.DTOS.Accounts;
//using IoT_system.DTOS.Common;
//using IoT_system.DTOS.Notification;
//using IoT_system.Models;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Options;

//namespace IoT_system.Services.Notification
//{
//    public class NotificationServicesImpl : NotificationServices
//    {
//        private readonly DatabaseContext dbContext;
//        private readonly IMapper mapper;

//        public NotificationServicesImpl(
//            DatabaseContext _dbContext,
//            IMapper _mapper
//            )
//        {
//            dbContext = _dbContext;
//            mapper = _mapper;
//        }
//        // history for admin
//        public async Task<PagedResponseDtos<NotificationAdminResponseDtos>> HistoryForAdmin(int page, int pageSize)
//        {
//            if (page <= 0)
//            {
//                page = 1;
//            }
//            if (pageSize <= 0 || pageSize > 100)
//            {
//                pageSize = 10; // giới hạn max 100
//            }
//            // tolist nếu ko có record thì trả về [] nên ko cần check null
//            var query = dbContext.Notifications.AsNoTracking();

//            var totalItems = await query.CountAsync(); // đếm tổng trước khi phân trang
//            var notifications = await query.OrderBy(a => a.Id) // orderBy tăng dân theo id (PHẢI CÓ KHI PHÂN TRANG)
//                                     .Skip((page - 1) * pageSize)
//                                     .Take(pageSize)
//                                     .ToListAsync();

//            return new PagedResponseDtos<NotificationAdminResponseDtos>
//            {
//                Data = mapper.Map<List<NotificationAdminResponseDtos>>(notifications),
//                Page = page,
//                PageSize = pageSize,
//                TotalItems = totalItems,
//            };
//        }

//        // history for user
//        public async Task<PagedResponseDtos<NotificationUserResponseDtos>> HistoryForUser(int userId, int page, int pageSize)
//        {
//            if (page <= 0)
//            {
//                page = 1;
//            }
//            if (pageSize <= 0 || pageSize > 100)
//            {
//                pageSize = 10; // giới hạn max 100
//            }
//            // tolist nếu ko có record thì trả về [] nên ko cần check null
//            var query = dbContext.Notifications.AsNoTracking();

//            var totalItems = await query.CountAsync(); // đếm tổng trước khi phân trang
//            var notifications = await query.OrderBy(a => a.Id) // orderBy tăng dân theo id (PHẢI CÓ KHI PHÂN TRANG)
//                                     .Where(n => n.UserId == userId)
//                                     .Skip((page - 1) * pageSize)
//                                     .Take(pageSize)
//                                     .ToListAsync();

//            return new PagedResponseDtos<NotificationUserResponseDtos>
//            {
//                Data = mapper.Map<List<NotificationUserResponseDtos>>(notifications),
//                Page = page,
//                PageSize = pageSize,
//                TotalItems = totalItems,
//            };
//        }


//        // filter ngày, đã đọc/chưa đọc, loại cảm biến gửi lên gas/độ ẩm, 
//    }
//}

using AutoMapper;
using IoT_system.DTOS.Common;
using IoT_system.DTOS.Notification;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;

namespace IoT_system.Services.Notification
{
    public class NotificationServicesImpl : NotificationServices
    {
        private readonly DatabaseContext dbContext;
        private readonly IMapper mapper;

        public NotificationServicesImpl(
            DatabaseContext _dbContext,
            IMapper _mapper)
        {
            dbContext = _dbContext;
            mapper = _mapper;
        }

        // ================= PRIVATE COMMON METHOD =================

        private async Task<PagedResponseDtos<TDto>> GetPagedNotifications<TDto>(
            IQueryable<Models.Notification> query,
            int page,
            int pageSize)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 || pageSize > 100
                ? 10
                : pageSize;

            var totalItems = await query.CountAsync();

            var notifications = await query
                .OrderBy(n => n.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResponseDtos<TDto>
            {
                Data = mapper.Map<List<TDto>>(notifications),
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            };
        }

        // ================= ADMIN =================

        public Task<PagedResponseDtos<NotificationAdminResponseDtos>>
            HistoryForAdmin(int page, int pageSize)
        {
            var query = dbContext.Notifications
                .AsNoTracking();

            return GetPagedNotifications<NotificationAdminResponseDtos>(
                query,
                page,
                pageSize);
        }

        // ================= USER =================

        public Task<PagedResponseDtos<NotificationUserResponseDtos>>
            HistoryForUser(int userId, int page, int pageSize)
        {
            var query = dbContext.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId);

            return GetPagedNotifications<NotificationUserResponseDtos>(
                query,
                page,
                pageSize);
        }
    }
}