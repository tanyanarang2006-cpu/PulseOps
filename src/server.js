
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http=require('http');

const vehicleRoutes = require("./routes/vehicleRoutes");
const connectDB = require('./config/db');
const {Server} = require('socket.io');
const {setIO} = require('./config/socket');


const app = express();
const server = http.createServer(app);
const io=new Server(server,{
  cors:{
    origin:"http://localhost:5173",
  },
});
setIO(io);

io.on('connection',(socket) => {
  console.log('Dahsboard connected:',socket.id);

  socket.on('disconnect',()=>{
    console.log('Dashboard disconnected:',socket.id)
  });
});

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

async function startServer(){
  await connectDB();
}

server.listen(PORT,()=>{
    console.log(`PulseOps running on port ${PORT}`)
})

startServer();

