using Microsoft.AspNetCore.Components.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using WebApplication1.Shared.DataAccess;

namespace WebApplication1.Client
{
    public class Startup
    {
       
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDbContext<OrderContext>();

        }

        public void Configure(IComponentsApplicationBuilder app)
        {
            app.AddComponent<App>("app");
        }
    }
}
