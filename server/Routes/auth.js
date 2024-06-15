const express = require('express')
const router = express.Router();
router.post('/gettoken',(req,res)=>{
    let data = req.body;
    let cred = req.headers.authorization;
    console.log(cred);
})
module.exports = router