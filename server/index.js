const express = require("express")
const app = express();
const router = require('../server/api/index');
const cors = require("cors");
const allowedOrigins = ['https://email-classifier-project-client.vercel.app','http://localhost:3000']; 
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(cors({
  origin:allowedOrigins,
  credentials: true 
}));
app.use(express.json());
app.use('/api/v1',router);
app.listen(3000,()=>{
    console.log("server up in port 3000");
})

