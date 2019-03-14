var express = require('express');
var router = express.Router();
var moment = require('moment');
moment.locale("fr");

//Select options for the <select>
var deps = [ "INFO1", "INFO2"],
    groupsInfo1 = [ "1A1", "1A2", "1B1", "1B2", "1C1", "1C2", "1D1", "1D2" ],
    groupsInfo2 = [ "2A1", "2A2", "2B1", "2B2", "2C1", "2C2", "2D1", "2D2" ];

/* GET home page. */
router.get('/', function(req, res, next) {

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);

    var param = req.query.group || req.cookies.group || "1A2";

    var paramChecker = /^[1,2][A-D][1,2]$/;
    if(!paramChecker.test(param)) param = "2D1";

    var paramInfo = param.substring(0,1);
    var paramGroup = param.substring(1);
    var group = [param, param.substring(0,param.length-1), paramInfo];
    var plan = (paramInfo === "1" ? req.planInfo1 : req.planInfo2);
    console.log(group);
    var courses = plan.getCourses(group, true, 50);

    //get unused room
    var rooms = req.unusedRoom.sallesDisponibles(Date.now()+1000*60*15); //maintenant plus 15 minutes

    var renderParam = { moment: moment, title: 'BDE@RootDuRhum - Planning '+param, courses: courses, options: {deps: deps, INFO1: groupsInfo1, INFO2: groupsInfo2}, selectedDep: "INFO"+paramInfo, selectedGroup: param, unused: rooms, menu: req.query.menu};
    res.render('index', renderParam);
});



module.exports = router;
