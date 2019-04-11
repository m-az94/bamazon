//--- 1.  Libraries Required to Run Program -- 
var inquirer = require("inquirer");
var mysql = require("mysql");
var Table = require("cli-table");

//--- 2. Establish connection to bamazon_db database
var connection = mysql.createConnection({
    host: "localhost",
    port:3306, 
    user: "root",
    password: "password",
    database: "bamazon_db",
    insecureAuth: true
});

//--- 3. Connect with bamazon_db
connection.connect(function(err){
    if (err) throw err;
    console.log("connected as id "+ connection.threadId);

    afterConnection();
});

//--- 4. this function describes the code that will be executed after a connection 
//       is made with the database.
function afterConnection(){
    console.log("WELCOME TO BAMAZON");
    //--- 4.1 Declare variables used to store values
    var storageArr = [];
    var respData={};

    //--- 4.2 Query the bamazon_db database products
    connection.query("SELECT * FROM products", function(err, res){
        if (err) throw err;

        //--- 4.3 loop through database query response
        for (var i=0; i<res.length; i++){
            respData = {
               item_id: res[i].item_id,
               product: res[i].product_name, 
               department: res[i].department_name,
               price: res[i].price,
               stock: res[i].stock_quantity
            }
            storageArr.push(respData);
        }
        displayProducts(storageArr);
        salesCall(storageArr);
    });
};

//--- 5. this function displays the values stored from the database as an easy to read table.
function displayProducts (arr){
   var table = new Table({
       head: ["ID", "Product", "Department", "Price"]
   });
   for (var j=0; j<arr.length; j++){
       if(arr[j].stock===0){/* Do Nothing */}
       else{
            table.push(
                [arr[j].item_id, arr[j].product, arr[j].department, arr[j].price]
            );
        }
   }
   console.log(table.toString());
}

//--- 6. this function prompts the user for what product and how many units of the product
//       the user intends to purchase, then processes or denies the sale based on availability
function salesCall (arr){
    // 6.1 query user for product and number of units 
    inquirer.prompt([
        {
            type: "input",
            name: "product_id",
            message: "What is the ID of the product you would like to purchase?",
            default: 1
        },
        {
            type: "input",
            name: "units",
            message: "How many units would you like to purchase?",
            default: 1
        }
    ]).then(function(sale){
        // 6.2 convert variables into integers
        var inputID = parseFloat(sale.product_id); // user input ID
        var inputUnit = parseFloat(sale.units); // user input units
        // 6.3 handling errors - check that product ID is found in db
        if (inputID>arr.length){
            console.log("Invalid ID. Please try again.");
            connection.end();
        }
        else{
            // 6.4 find product using product ID
            for (var k=0; k<arr.length; k++){
                // 6.5 if item is found, check if there are enough units for sale
                if (parseFloat(arr[k].item_id)===inputID){
                    if (parseFloat(arr[k].stock)>=inputUnit){
                        console.log("Your purchase has been processed. Thank you for shopping at Bamazon.");
                        var dbStock = parseFloat(arr[k].stock);
                        createReceipt(arr, inputID, inputUnit);
                        updatingInventory(inputID, inputUnit, dbStock);
                    }
                    else{
                        console.log("Insufficient quantity! Please try again");
                        connection.end();
                    }
                }
            }
        }
    });
}

//--- 7. this function creates a receipt for the customer 
function createReceipt (arr, id, unit){
    var locator=id-1;
    var product=arr[locator].product;
    var price=parseFloat(arr[locator].price);
    var total=Math.round((unit*price)*100)/100;
    console.log("--------------------------------------------------------");
    console.log("CUSTOMER RECEIPT");
    console.log("--------------------------------------------------------");
    console.log("You bought: "+product);
    console.log("Price: $"+price);
    console.log("Units: "+unit);
    console.log("Total price: $"+total);
    console.log("--------------------------------------------------------");
}

//--- 8. this function updates the inventory in the MySQL database
function updatingInventory(id, units, dbStock){
    var stockChange = dbStock-units;
    var sql = "UPDATE products SET stock_quantity='"+stockChange+"' WHERE item_id='"+id+"'";
    connection.query(sql, function(err, res){
        if (err) throw err;
        // console.log(res.affectedRows+" record(s) updated.");
        // ^ this was to test if db updated
        connection.end();
    });
}
