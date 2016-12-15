var express = require('express');
var router = express.Router();
var Planning = require('../planning');

var plan = new Planning("8241fc387320021460d62b880601db3b64f024f9f358aca3f8c622193b252c7c70ca02662d77329d659f71eb5a546079ab0d0ef21be75acf7c140d03600301e2f68b608172d7a40a23f88ba273aab1d0acd7b24671b1194634ae47158ec67a871331a2981729d29a504cdf3c1acef8543cfd5b81b930e6b64fdfbb1046e3de9bbcfeea78fed0a8b4");

plan.updateLocal(true,'planning/planning.ics');

console.log("update");
plan.updatePlanning();

/* GET home page. */
router.get('/', function(req, res, next) {

    var param = req.query.group;
    if(!param) param = req.cookies.group;
    if(!param) param = "2C1";


    var group = [param, param.substring(0,param.length-1), param.substring(0,param.length-2)];
    //console.log(group);
    var courses = plan.getCourses(group, true);

    // for(var i=0; i < courses.length; i++) {
    //     courses[i].start = moment(courses[i].start).format('LLL');
    //     courses[i].end = moment(courses[i].end).format('LLL');
    // }
    var options = [ "2A1", "2A2", "2B1", "2B2", "2C1", "2C2", "2D1", "2D2" ];
    res.render('index', { title: 'Planning '+param, courses: courses, options: options, selected: param });
});

setInterval(()=>{
  plan.updatePlanning();
  console.log("update");
},120000);

module.exports = router;
