const express = require("express");
const bodyParser = require("body-parser");
const ExcelJS = require("exceljs");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // allow frontend hosted on GitHub Pages to call backend

const file = "orders.xlsx";

// Create Excel file with headers if it doesn't exist
if (!fs.existsSync(file)) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Orders");
  sheet.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Class", key: "class", width: 15 },
    { header: "Item", key: "item", width: 25 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Price Each", key: "price", width: 12 },
    { header: "Total Price", key: "total", width: 12 },
    { header: "Payment Method", key: "payment", width: 15 },
    { header: "Date", key: "date", width: 12 },
    { header: "Time", key: "time", width: 12 }
  ];
  workbook.xlsx.writeFile(file);
}

// ✅ API to place order
app.post("/place-order", async (req, res) => {
  try {
    const order = req.body; // { name, class, items:[{item, qty, price}], total, payment, date, time }

    if (!order || !order.items || order.items.length === 0) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);
    const sheet = workbook.getWorksheet("Orders");

    // Insert each item separately
    order.items.forEach(itm => {
      sheet.addRow({
        name: order.name,
        class: order.class,
        item: itm.item,
        quantity: itm.qty,
        price: itm.price,
        total: itm.qty * itm.price,
        payment: order.payment,
        date: order.date,
        time: order.time
      });
    });

    await workbook.xlsx.writeFile(file);

    res.json({ success: true, message: "Order saved successfully" });
  } catch (err) {
    console.error("Error saving order:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Admin download Excel (password protected)
app.get("/admin/:password", (req, res) => {
  if (req.params.password !== "canteenadmin123") {  // change password here
    return res.status(403).send("Forbidden");
  }
  res.download(file);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
