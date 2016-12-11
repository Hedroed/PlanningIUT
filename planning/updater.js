const https = require('https');
const moment = require('../node_modules/moment');

var getCalendar = function(idCalendar, callback){
    var options = {
        host: 'planning.univ-ubs.fr',
        path: '/jsp/custom/modules/plannings/anonymous_cal.jsp?data=' + idCalendar
    };
    https.request(options, function(res) {
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
    }).end();
}

var parse = function(data,callback) {
    var json = [];
    var arrayDataCalendar = data.split("\r\n");

    var begin = false;
    var course = null;

    //console.log(arrayDataCalendar);

    for (var line of arrayDataCalendar){
        // console.log(line);
        var splitedLine = line.split(':');

        if (splitedLine[0] === "BEGIN" && splitedLine[1] === "VEVENT"){
            begin = true;
            course = {};
        }

        if (begin && course != null) {
            if (splitedLine[0] === "DTSTART"){
                course.start = toDate(splitedLine[1]);
                course.startFormat = moment(course.start.getTime()).format("DD/MM/YYYY HH:mm");
            }

            if (splitedLine[0] === "DTEND"){
                course.end = toDate(splitedLine[1]);
                course.endFormat = moment(course.end.getTime()).format("DD/MM/YYYY HH:mm");
            }

            if (splitedLine[0] === "LOCATION"){
                var roomName = /.*(B \d{3}|Amphi [ABC]|Jocker \d|Joker \d).*/;
                course.location = [];
                var rooms = splitedLine[1].split('\\,');
                for(elem of rooms){
                    var room = roomName.exec(elem);
                    if(room != null) course.location.push(room[1]);
                }
            }

            if (splitedLine[0] === "SUMMARY"){
                course.name = splitedLine[1].replace("\\,",",");
            }

            if (splitedLine[0] === "DESCRIPTION"){
                var line = splitedLine[1].split('(')[0];
                var tab = line.split('\\n');
                tab.pop();
                tab.shift();

                var allGroup = /(GR|Gr|Groupe|INFO|STID|LP|LPCEL)/;
                var sameGroup = /(GR|Gr|Groupe)/;
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
                //course.description = regex.exec(splitedLine[1]);
            }
        }

        if (splitedLine[0] === "END" && splitedLine[1] === "VEVENT"){
            begin = false;
            json.push(course);
            course = null;
        }
    }

    json.sort(function (a, b) {
        if(a.start == undefined || b.start == undefined) return -1;

        if (a.start.getTime() > b.start.getTime())
            return 1;
        if (a.start.getTime() < b.start.getTime())
            return -1;
        // a doit être égale à b
        return 0;
    });

    if(callback) callback({courses : json});
}

function toDate(line) {
    return new Date(Date.UTC(line.substring(0,4), +line.substring(4,6)-1, line.substring(6,8), line.substring(9,11), line.substring(11,13), line.substring(13,15)));
}

module.exports = {getCalendar: getCalendar};
