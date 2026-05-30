using AutoMapper;
using IoT_system.DTOS.Accounts;
using IoT_system.DTOS.Common;
using IoT_system.DTOS.Devices;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;

namespace IoT_system.Services.Devices
{
    public class DeviceServicesImpl : DeviceServices
    {
        private readonly DatabaseContext dbContext;
        private readonly IMapper mapper;

        public DeviceServicesImpl(DatabaseContext _dbContext, IMapper _mapper)
        {
            dbContext = _dbContext;
            mapper = _mapper;
        }
    }
}
