const express = require("express")
const app = express();
const router = require('../server/api/index');
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use('/api/v1',router);
app.listen(3001,()=>{
    console.log("server up in port 3000");
})

