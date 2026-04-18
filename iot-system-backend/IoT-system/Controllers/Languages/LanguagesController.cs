using IoT_system.Services.Languages;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace IoT_system.Controllers.Languages
{
    [Route("api/language")]
    public class LanguagesController : Controller
    {
        private readonly LanguageServices languageServices;

        public LanguagesController(LanguageServices _languageServices) { 
            languageServices = _languageServices;
        }

        [Produces("application/json")]
        [HttpGet("languages-list")]
        public async Task<IActionResult> GetLanguages()
        {
            try
            {
                return Ok(await languageServices.FindAll());
            }
            catch (Exception ex) {
                return BadRequest(new
                {
                    error = ex.Message
                });
            }
        }
    }
}
