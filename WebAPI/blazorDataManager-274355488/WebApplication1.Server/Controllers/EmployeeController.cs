//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Threading.Tasks;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using WebApplication1.Shared.DataAccess;
//using WebApplication1.Shared.Models;

//namespace WebApplication1.Server.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class EmployeeController : ControllerBase
//    {
//        EmployeeDataAccessLayer objemployee = new EmployeeDataAccessLayer();

//        [HttpGet]
//        [Route("api/Employee/Index")]
//        public IEnumerable<Order> Index()
//        {
//            return objemployee.GetAllEmployees();
//        }

//        [HttpPost]
//        [Route("api/Employee/Create")]
//        public void Create([FromBody] Order employee)
//        {
//            if (ModelState.IsValid)
//                objemployee.AddEmployee(employee);
//        }

//        [HttpGet]
//        [Route("api/Employee/Details/{id}")]
//        public Order Details(int id)
//        {

//            return objemployee.GetEmployeeData(id);
//        }

//        [HttpPut]
//        [Route("api/Employee/Edit")]
//        public void Edit([FromBody]Order employee)
//        {
//            if (ModelState.IsValid)
//                objemployee.UpdateEmployee(employee);
//        }

//        [HttpDelete]
//        [Route("api/Employee/Delete/{id}")]
//        public void Delete(int id)
//        {
//            objemployee.DeleteEmployee(id);
//        }
//    }
//}