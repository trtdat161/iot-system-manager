using AutoMapper;
using IoT_system.DTOS.languages;
using IoT_system.Models;
using Microsoft.EntityFrameworkCore;

namespace IoT_system.Services.Languages
{
    public class LanguageServiceImpl : LanguageServices
    {
        private readonly DatabaseContext dbContext;
        private readonly IMapper mapper;


        public LanguageServiceImpl(DatabaseContext _dbContext, IMapper _mapper)
        {
            dbContext = _dbContext;
            mapper = _mapper;
        }

        public async Task<List<LanguageResponseDtos>> FindAll()
        {
            var languages = await dbContext.Languages.ToListAsync();
            return mapper.Map<List<LanguageResponseDtos>>(languages);
        }
    }
}
