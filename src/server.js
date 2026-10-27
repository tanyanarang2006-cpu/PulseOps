
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "PulseOps API is running",
  });
});

app.use('/api/vehicles',vehicleRoutes)

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`PulseOps running on port ${PORT}`)
})
