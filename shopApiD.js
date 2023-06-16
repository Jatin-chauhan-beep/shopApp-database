let express = require("express");
let app = express();
app.use(express.json());
app.use(function (req, res, next) {
res.header("Access-Control-Allow-Origin", "*");
res.header(
"Access-Control-Allow-Methods",
"GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
);
res.header(
"Access-Control-Allow-Headers",
"Origin, X-Requested-With, Content-Type, Accept"
);
next();
});
const port = process.env.PORT||2410;
app.listen(port, () => console.log(`Listening on port ${port}!`));


const { Client }=require("pg"); 
const client = new Client({
user: "postgres",
password: "Shopapp@123.", 
database: "postgres",
port: 5432,
host: "db.wshsoynrnyubclgexmps.supabase.co",
ssl: { rejectUnauthorized: false },
}); 
client.connect(function (res, error) {
console.log("Connected!!!");
});
app.get('/shops', (req, res) => {
    const sql = 'SELECT * FROM shops';
  
    client.query(sql, (err, result) => {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(result.rows);
      }
    });
  });

  app.post("/shops",function(req,res){
    let body=Object.values(req.body);
    const sql = 'INSERT INTO shops(name,rent) VALUES($1,$2)';
    client.query(sql,body,(err, result) => {
        if (err) {
          res.status(404).send(err);
        } else {
          res.send(result.rows);
        }
      });
        
});

app.get("/products",function(req,res){
    const sql = 'SELECT * FROM products';
  
    client.query(sql, (err, result) => {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(result.rows);
      }
    });
});

app.post("/products",function(req,res){
    let body=Object.values(req.body);
    const sql = 'INSERT INTO products(productname,category,description) VALUES($1,$2,$3)';
    client.query(sql,body,(err, result) => {
        if (err) {
          res.status(404).send(err);
        } else {
          res.send(result.rows);
        }
      });
        
});

app.put("/products/:id",(req,res)=>{
    let body=req.body;
    let id=+req.params.id;
    let sql="UPDATE products SET productname = $1, category = $2, description = $3  WHERE productid =$4";
    client.query(sql,[body.productname,body.category,body.description,id],(err)=>{
        if(err) res.status(404).send(err);
        else res.send(body);
    });
});

app.get("/purchases",function(req,res){
    let shop = req.query.shop;
  let product = req.query.product;
  let sort = req.query.sort;

  let sqlPurchases = 'SELECT * FROM purchases';
  let sqlProducts = 'SELECT * FROM products';
  let sqlShops = 'SELECT * FROM shops';
  

  client.query(sqlPurchases, (errPurchases, resultPurchases) => {
    if (errPurchases) {
      res.status(400).send(errPurchases);
    } else {
      client.query(sqlProducts, (errProducts, resultProducts) => {
        if (errProducts) {
          res.status(400).send(errProducts);
        } else {
          client.query(sqlShops, (errShops, resultShops) => {
            if (errShops) {
              res.status(400).send(errShops);
            } else {
              let arr1 = resultPurchases.rows;
              const products = resultProducts.rows;
              const shops = resultShops.rows;
              if (product) {
                let productList = product.split(",");
                arr1 = arr1.filter(f => productList.includes(`pr${f.productid}`));
              }
            if(shop){
                arr1=arr1.filter(f=>f.shopid==shop.substring(2,3));
            }
            if(sort=="QtyAsc"){
                arr1=arr1.sort((p1,p2)=>p1.quantity-p2.quantity);
            }
            if(sort=="QtyDesc"){
                arr1=arr1.sort((p1,p2)=>p2.quantity-p1.quantity);
            }
            if(sort=="ValueAsc"){
                arr1=arr1.sort((p1,p2)=>(p1.quantity*p1.price)-(p2.quantity*p2.price));
            }
            if(sort=="ValueDesc"){
                arr1=arr1.sort((p1,p2)=>(p2.quantity*p2.price)-(p1.quantity*p1.price));
            }
              res.send({ purchases:arr1, products, shops });
            }
          });
        }
      });
    }
  });
});

app.get("/purchases/shops/:id",function(req,res){
    let id=+req.params.id;
    const sql = 'SELECT * FROM purchases WHERE shopid=$1';
  
    client.query(sql,[id],(err, result) => {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(result.rows);
      }
    });
});

app.get("/purchases/products/:id",function(req,res){
    let id=+req.params.id;
    const sql = 'SELECT * FROM purchases WHERE productid=$1';
  
    client.query(sql,[id],(err, result) => {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(result.rows);
      }
    });
});

app.get("/totalPurchase/shop/:id", function(req, res) {
    let id = +req.params.id;
  
    let sql = `
      SELECT products.*, IFNULL(SUM(purchases.quantity), 0) AS totalPurchase
      FROM products
      LEFT JOIN purchases ON products.productid = purchases.productid
      WHERE purchases.shopid = $1
      GROUP BY products.productid
    `;
  
    client.query(sql, [id], (err, result) => {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(result.rows);
      }
    });
  });

  app.get("/totalPurchase/product/:id", function(req, res) {
    let id = +req.params.id;
  
    let sql = `
      SELECT purchases.shopid, shops.name, shops.rent, SUM(purchases.quantity) AS totalPurchase
      FROM purchases
      INNER JOIN shops ON purchases.shopid = shops.shopid
      WHERE purchases.productid = $1
      GROUP BY purchases.shopid
    `;
  
    client.query(sql, [id], (err, result) => {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(result.rows);
      }
    });
  });

  app.post("/purchases",function(req,res){
    let body=Object.values(req.body);
    const sql = 'INSERT INTO purchases(shopid,productid,quantity,price) VALUES($1,$2,$3,$4)';
    client.query(sql,body,(err, result) => {
        if (err) {
          res.status(404).send(err);
        } else {
          res.send(result.rows);
        }
      });
        
});
  
