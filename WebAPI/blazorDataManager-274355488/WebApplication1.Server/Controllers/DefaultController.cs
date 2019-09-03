using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using WebApplication1.Shared.DataAccess;
using WebApplication1.Shared.Models;
using WebApplication11;

namespace WebApplication1.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DefaultController : ControllerBase
    {
        //public int i = 100;
        OrderDataAccessLayer db = new OrderDataAccessLayer();
        // GET: api/Default
        [HttpGet]
        public object Get()
        {

            IQueryable<Order> data = db.GetAllOrders().AsQueryable();
            
            var count = data.Count();
            var queryString = Request.Query;
            string sort = queryString["$orderby"];   //sorting     
            string filter = queryString["$filter"];
            string auto = queryString["$inlineCount"];
            if (sort != null) //Sorting
            {
                var sortfield = sort.Split(' ');
                var sortColumn = sortfield[0];
                if (sortfield.Length == 2)
                {
                    sortColumn = sortfield[0];
                    switch (sortColumn)
                    {
                        case "OrderID":
                                data = data.OrderByDescending(x => x.OrderID);
                            break;
                        case "CustomerID":
                                data = data.OrderByDescending(x => x.CustomerID);
                            break;
                        case "EmployeeID":
                                data = data.OrderByDescending(x => x.EmployeeID);
                            break;
                    }
                }
                else {
                    switch (sortColumn)
                    {
                        case "OrderID":
                            data = data.OrderBy(x => x.OrderID);
                            break;
                        case "CustomerID":
                            data = data.OrderBy(x => x.CustomerID);
                            break;
                        case "EmployeeID":
                            data = data.OrderBy(x => x.EmployeeID);
                            break;
                    }
                }
            }
            if (filter != null)
            {
                var newfiltersplits = filter;
                var filtersplits = newfiltersplits.Split('(', ')', ' ');
                var filterfield = filtersplits[1];
                var filtervalue = filtersplits[3];

                if (filtersplits.Length == 7)
                {
                    if (filtersplits[2] == "tolower")
                    {
                        filterfield = filter.Split('(', ')', '\'')[3];
                        filtervalue = filter.Split('(', ')', '\'')[5];
                    }
                }
                switch (filterfield)
                {


                    case "OrderID":

                        data = (from cust in data
                                where cust.OrderID.ToString() == filtervalue.ToString()
                                select cust);
                        break;
                    case "CustomerID":
                        data = (from cust in data
                                where cust.CustomerID.ToLower().StartsWith(filtervalue.ToString())
                                select cust);
                        break;
                    case "EmployeeID":
                        data = (from cust in data
                                where cust.EmployeeID.ToString() == filtervalue.ToString()
                                select cust);
                        break;
                }
            }
            if (queryString.Keys.Contains("$inlinecount"))
            {
                StringValues Skip;
                StringValues Take;
                int skip = (queryString.TryGetValue("$skip", out Skip)) ? Convert.ToInt32(Skip[0]) : 0;
                int top = (queryString.TryGetValue("$top", out Take)) ? Convert.ToInt32(Take[0]) : data.Count();
                return new { Items = data.Skip(skip).Take(top), Count = count };
            }
            else
            {
                return data;
            }
        }

        // GET: api/Default/5
        [HttpGet("{id}", Name = "Get")]
        public string Get(int id)
        {
            return "value";
        }

        //// POST: api/Default
        [HttpPost]
        public void Post([FromBody]Order Order)
        {
            /// code for Insert operation   
            /// 

            Random rand = new Random();

            
            db.AddOrder(Order);

        }

        //// PUT: api/Default/5
        [HttpPut]
        public object Put([FromBody]Order Order)
        {
            /// code for Update operation
            db.UpdateOrder(Order);
            return Order;
        }


        //// DELETE: api/ApiWithActions/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
            /// code for delete operation
            db.DeleteOrder(id);

        }  

    }
}
