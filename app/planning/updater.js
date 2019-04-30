const https = require('https');
const moment = require('../node_modules/moment');

//Get planning information from web
var getCalendar = function(idCalendar, callback){
    var options = {
        host: 'planning.univ-ubs.fr',
        path: '/jsp/custom/modules/plannings/anonymous_cal.jsp?data=' + idCalendar
    };
    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        var data = '';
        ///////////////////////
        res.on('data', function(chunk) {
            data += chunk;
        });
        ///////////////////////
        res.on('end', function(){
            parse(data,callback);
        });
    });
    req.on('error', function(err) {
        console.error("Http error:", err);
        callback({courses : []})
    });
    req.end();
}

//Parse ics file format
var parse = function(data,callback) {
    //parse line into date object
    function toDate(line) {
        return moment(line);
        // return new Date(Date.UTC(line.substring(0,4), +line.substring(4,6)-1, line.substring(6,8), line.substring(9,11), line.substring(11,13), line.substring(13,15)));
    }

    var json = [];
    var arrayDataCalendar = data.split("\r\n");

    var begin = false;
    var course = null;

    //console.log(arrayDataCalendar);

    for (var line of arrayDataCalendar){
        // console.log(line);
        var separator = line.indexOf(':');
        var startLine = line.substring(0, separator);
        var endLine = line.substring(separator+1);

        if (startLine === "BEGIN" && endLine === "VEVENT"){
            begin = true;
            course = {};
        }

        if (begin && course != null) {
            if (startLine === "DTSTART"){
                course.start = toDate(endLine);
                // course.startFormat = moment(course.start.getTime()).format("DD/MM HH:mm");
            }

            if (startLine === "DTEND"){
                course.end = toDate(endLine);
                // course.endFormat = moment(course.end.getTime()).format("DD/MM HH:mm");
            }

            if (startLine === "LOCATION"){
                var roomName = /.*(B \d{3}|Amphi [ABC]|Jocker \d|Joker \d).*/;
                course.location = [];
                var rooms = endLine.split('\\,');
                for( var elem of rooms){
                    var room = roomName.exec(elem);
                    if(room != null) course.location.push(room[1]);
                }
            }

            if (startLine === "SUMMARY"){
                course.name = endLine.replace("\\,",",");
            }

            if (startLine === "DESCRIPTION"){
                var line = endLine.split('(')[0];
                var tab = line.split('\\n');
                tab.pop();
                tab.shift();

                var allGroup = /(GR|Gr|Groupe|groupe|INFO|STID|LP|LPCEL)/;
                var sameGroup = /(GR|Gr|Groupe|groupe)/;
                var ret = [];

                for(elem of tab) {
                    if(elem != undefined) {
                        var line = elem.split(' ');
                        if(allGroup.exec(line[0])) {
                            if(course.group == undefined) course.group = [];
                            course.group.push(elem.substring(elem.indexOf(' ')+1));

                            if(sameGroup.exec(line[0])) line[0] = "GR";
                            course.groupType = line[0];
                        }
                        else if(line[0] === "Prof") {
                        }
                        else {
                            ret.push(elem);
                        }
                    }
                }
                course.description = ret;

                //var regex = /\\n(.*)\\n(.*)\\n(.*)/;
                //course.description = regex.exec(endLine);
            }
        }

        if (startLine === "END" && endLine === "VEVENT"){
            begin = false;
            json.push(course);
            course = null;
        }
    }

    json.sort(function (a, b) {
        if(a.start == undefined || b.start == undefined) return -1;

        if (a.start > b.start)
            return 1;
        if (a.start < b.start)
            return -1;
        // a doit être égale à b
        return 0;
    });

    if(callback) callback({courses : json});
}


module.exports = {getCalendar: getCalendar, parse: parse};
