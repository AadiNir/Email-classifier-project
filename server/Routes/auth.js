const express = require('express')
const router = express.Router();
router.post('/gettoken',(req,res)=>{
    let data = req.body;
    const token = data.credentials;
    localStorage.setItem("oauth-token",token);
    res.json("hola")
})
module.exports = router