var express = require('express');
var router = express.Router();
var Planning = require('../planning');
var moment = require('moment');
moment.locale("fr");

var Calendar = require('../room');
var targetRooms = ['B 126', 'B 141', 'B 024', 'B 029', 'B 003', 'B 005', 'B 022', 'B 028', 'B 035', 'B 037'];
var unusedRoom =  new Calendar("8241fc38732002141317a107b7ce989cd1bb95aa76bef7d8013f8ecf19fbd900729809d86cd297df23343573b6d8e6dca84371115c57ce3f92b82f42d84baba9ad770359a5f53f56f7c903b47fbaea3f809e79060ee999f4df6c31ef932e3e6c85f2b25bc040fa19498424fc3aa6bf4a7b701a69e4929514a885d1cf1c1a74d421cc8a1e31f0ca00be7c9db77b1b15d9a47c1e9b682d7428126e69f83c1b3920dbf65ba57e2fd7f3995819b0e211f491b4ef9aba751bdce73a0eaecf799cbced50c55e7f25926a723ae4bd107b2ce328d4a2ff76e2f7d5696ca90484c4b2ac6af9c4bc151f5a34001d9b6310a318facbf377b612dec2c5fba5147d40716acb136310d0ae215603f5", targetRooms);

var planInfo2 = new Planning("8241fc387320021460d62b880601db3b64f024f9f358aca3f8c622193b252c7c70ca02662d77329d659f71eb5a546079ab0d0ef21be75acf7c140d03600301e2f68b608172d7a40a23f88ba273aab1d0acd7b24671b1194634ae47158ec67a871331a2981729d29a504cdf3c1acef8543cfd5b81b930e6b64fdfbb1046e3de9bbcfeea78fed0a8b4");
var planInfo1 = new Planning("8241fc38732002147feaa7994a14fb1e46e84f7c9b78e263799f3e18454a68d7f9e7187a83de3688b2feb32c6fb898ec6388e00a65894b9fae26dd6b71b817bb50b37189fa0b8d2bddf02cf567b7259696298c15bc4f3e24");
//plan.updateLocal(true,'planning/planning.ics');

console.log("update");
planInfo2.updatePlanning();
planInfo1.updatePlanning();

//Select options for the <select>
var deps = [ "INFO1", "INFO2"];
    groupsInfo1 = [ "1A1", "1A2", "1B1", "1B2", "1C1", "1C2", "1D1", "1D2" ],
    groupsInfo2 = [ "2A1", "2A2", "2B1", "2B2", "2C1", "2C2", "2D1", "2D2" ];

/* GET home page. */
router.get('/', function(req, res, next) {

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);

    var param = req.query.group || req.cookies.group || "2C1";
    var paramInfo = param.substring(0,1);
    var paramGroup = param.substring(1);
    var group = [param, param.substring(0,param.length-1), paramInfo];
    var plan = paramInfo === "1" ? planInfo1 : planInfo2;
    console.log(group);
    var courses = plan.getCourses(group, true);

    //get unused room
    var rooms = unusedRoom.sallesDisponibles();

    var renderParam = { moment: moment, title: 'Planning '+param, courses: courses, options: {deps: deps, INFO1: groupsInfo1, INFO2: groupsInfo2}, selectedDep: "INFO"+paramInfo, selectedGroup: param, unused: rooms };
    res.render('index', renderParam);
});

setInterval(()=>{
    planInfo2.updatePlanning();
    planInfo1.updatePlanning();
    Calendar.updateCalendar(targetRooms);
    console.log("update");
},2 * 60000); // 2 minutes

module.exports = router;
