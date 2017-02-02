#!/bin/node

var http = require('http');

var t = require('./ipInfo.json');

var infos = [];
var keys = Object.keys(t);

var length = keys.length;
console.log("IP : "+length);

for(var key of keys) {

  getInfo(key, t[key], function(info) {
    //   console.log(info);
      infos.push(info);

      if(infos.length === length) {
          sortAndDisplay();
      }
  });

}

function sortAndDisplay() {
    infos.sort((a,b)=>{

        if(a.org < b.org) {
            return -1;
        } else if(a.org > b.org) {
            return 1;
        } else {
            if(a.country < b.country) {
                return -1;
            } else if(a.country > b.country) {
                return 1;
            } else {
                if(a.city < b.city) {
                    return -1;
                } else if(a.city > b.city) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }

    });

    // console.log(infos);
    var count = 0;
    for(var i of infos) {
        console.log(i.nb+"::"+i.ip+":    "+i.country+":"+i.city+":"+i.org);
        count+=i.nb;
    }
    console.log("Nb total de connexions "+count);
}

function getInfo(ip, nb, cb) {
    var url = 'http://ip-api.com/json/';

    http.get(url+ip, function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            var info = JSON.parse(body);
            //console.log("Got a response: ", info);
            if(info.status === 'success') {
                if(cb) cb({nb: nb, ip: info.query, country: info.country, city: info.city, org: info.org});
                // nb+"::"+info.query+":    "+info.country+":"+info.city+":"+info.org);
            }
        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });
}
