const express = require('express')
const router = express.Router();
const oauth = require('../Routes/auth')
router.use('/auth',oauth)
// router.use("/emailclassifier")
module.exports = router