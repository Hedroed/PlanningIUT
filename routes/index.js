var express = require('express');
var router = express.Router();
var Planning = require('../planning');

var plan = new Planning("8241fc387320021460d62b880601db3b64f024f9f358aca3f8c622193b252c7c70ca02662d77329d659f71eb5a546079ab0d0ef21be75acf7c140d03600301e2f68b608172d7a40a23f88ba273aab1d0acd7b24671b1194634ae47158ec67a871331a2981729d29a504cdf3c1acef8543cfd5b81b930e6b64fdfbb1046e3de9bbcfeea78fed0a8b4");
plan.updatePlanning();

/* GET home page. */
router.get('/', function(req, res, next) {
    var param = req.query.group;

    var group = [param, param.substring(0,param.length-1), param.substring(0,param.length-2)];
    //console.log(group);
    var courses = plan.getCourses(group);

    // for(var i=0; i < courses.length; i++) {
    //     courses[i].start = moment(courses[i].start).format('LLL');
    //     courses[i].end = moment(courses[i].end).format('LLL');
    // }

    res.render('index', { title: 'Planning '+param, courses: courses });
});

setInterval(()=>{
  plan.updatePlanning();
  console.log("update");
},120000);

module.exports = router;
