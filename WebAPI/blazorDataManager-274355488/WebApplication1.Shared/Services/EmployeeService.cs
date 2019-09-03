using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.Shared.DataAccess;
using WebApplication1.Shared.Models;

namespace WebApplication1.Shared.Services
{
    
    public class OrderService
    {
        OrderDataAccessLayer objEmp = new OrderDataAccessLayer();

        public Task<List<Order>> GetEmployeeList() {

            return Task.FromResult(objEmp.GetAllOrders());
        }


    }
}
