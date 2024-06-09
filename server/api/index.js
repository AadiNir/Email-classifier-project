const express = require('express')
const router = express.Router();
const oauth = require('../Routes/auth')
const mail = require('../Routes/mail')
router.use('/auth',oauth)
router.use("/emailclassifier",mail)
module.exports = router