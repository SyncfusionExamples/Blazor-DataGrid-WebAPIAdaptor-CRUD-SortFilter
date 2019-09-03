function changeAdaptor() {
    var grid = document.getElementsByClassName("e-grid")[0].ej2_instances[0];
    grid.dataSource = new ej.data.DataManager({
        json:[{ "EmployeeID": 123, "FirstName": "kavi", "LastName": "priya", "City": "Germany" }, { "EmployeeID": 124, "FirstName": "kavitha", "LastName": "surya", "City": "USA" }],
        updateUrl:"/api/Default/Put",
        insertUrl: "/api/Default/Post",
        removeUrl:"/api/Default/Delete",
        adaptor: new ej.data.RemoteSaveAdaptor()
    });
    
}
