var express = require('express');
var router = express.Router();
var Planning = require('../planning');
var moment = require('moment');
moment.locale("fr");

var plan = new Planning("8241fc387320021460d62b880601db3b64f024f9f358aca3f8c622193b252c7c70ca02662d77329d659f71eb5a546079ab0d0ef21be75acf7c140d03600301e2f68b608172d7a40a23f88ba273aab1d0acd7b24671b1194634ae47158ec67a871331a2981729d29a504cdf3c1acef8543cfd5b81b930e6b64fdfbb1046e3de9bbcfeea78fed0a8b4");
//plan.updateLocal(true,'planning/planning.ics');

console.log("update");
plan.updatePlanning();

//Select options for the <select>
var deps = [ "INFO1", "INFO2", "STID1", "STID2", "GEA1", "GEA2", "TC1", "TC2" ];
    groupsInfo1 = [ "1A1", "1A2", "1B1", "1B2", "1C1", "1C2", "1D1", "1D2" ],
    groupsInfo2 = [ "2A1", "2A2", "2B1", "2B2", "2C1", "2C2", "2D1", "2D2" ],
    groupsSTID1 = [ "1A1", "1A2", "1B1", "1B2", "1C1", "1C2", "1D1", "1D2" ],
    groupsSTID2 = [ "2A1", "2A2", "2B1", "2B2", "2C1", "2C2", "2D1", "2D2" ],
    groupsGEA1 = [ "1A1", "1A2", "1B1", "1B2", "1C1", "1C2", "1D1", "1D2" ],
    groupsGEA2 = [ "2A1", "2A2", "2B1", "2B2", "2C1", "2C2", "2D1", "2D2" ],
    groupsTC1 = [ "1A1", "1A2", "1B1", "1B2", "1C1", "1C2", "1D1", "1D2" ],
    groupsTC2 = [ "2A1", "2A2", "2B1", "2B2", "2C1", "2C2", "2D1", "2D2" ];

/* GET home page. */
router.get('/', function(req, res, next) {

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);

    var param = req.query.group || req.cookies.group || "2C1";

    var group = [param, param.substring(0,param.length-1), param.substring(0,param.length-2)];
    var courses = plan.getCourses(group, true);

    res.render('index', { moment: moment, title: 'Planning '+param, courses: courses, options: groupsInfo2, selected: param });
});

setInterval(()=>{
  plan.updatePlanning();
  console.log("update");
},2 * 60000); // 2 minutes

module.exports = router;
