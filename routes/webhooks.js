var express = require('express');
var router = express.Router();
var Planning = require('../planning');
var moment = require('moment');
moment.locale("fr");

/* GET home page. */
router.get('/', function(req, res, next) {

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);
    
    console.log(req.query);
    
    res.sendStatus(200);
});

module.exports = router;
