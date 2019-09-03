using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebApplication1.Shared.Models;

namespace WebApplication1.Shared.DataAccess
{
    public interface IDataAccess
    {
        Task<List<Order>> GetAllRecords();
    }
}
