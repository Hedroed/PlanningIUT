var express = require('express');
var router = express.Router();
var request = require('request');
var moment = require('moment');
moment.locale("fr");

//polyfill
Number.prototype.toRadians = function() {
   return this * Math.PI / 180;
}

var API_KEY = "AIzaSyB_AjPMcqwoEZtcB_EJouqH0MJfFUg6vls";

/* GET home page. */
router.get('/', function(req, res, next) {

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);

    var param = {
        lat: 48.809362,
        long: 2.365064,
        types: "food|cafe|bakery|restaurant|bar"
    };

    radar(param, (e)=>{
        for(var i=0; i<5;i++){
            getPlaceInfos(e[i].place_id, (place)=>{
                console.log(place);
                console.log(place.distance(param.lat, param.long)+" m");
            });
        }
    });

    res.sendStatus(200);
});

function radar(param, cb) {
    request({
        uri: "https://maps.googleapis.com/maps/api/place/radarsearch/json",
        qs: {
            location: param.lat+","+param.long,
            radius: 500,
            types: param.types,
            key: API_KEY
        },
        method: 'GET'
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("ok");
            body = JSON.parse(body);

            if(cb) cb(body.results);

        } else {
            console.error("Unable to acess API.");
            console.error(response);
            console.error(error);
        }
    });
}

function getPlaceInfos(placeId, cb) {
    request({
        uri: "https://maps.googleapis.com/maps/api/place/details/json",
        qs: {
            placeid: placeId,
            key: API_KEY
        },
        method: 'GET'
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("ok");
            body = JSON.parse(body);
            if(body.result) {
                res = body.result;
                var phUrl = getPlacePhoto(res.photos[0].photo_reference);
                if(cb) cb(new Place(res.id, res.name, res.geometry.location.lat, res.geometry.location.lng, res.formatted_address, res.opening_hours.open_now, res.international_phone_number, phUrl, res.url, res.website));
            } else {
                console.log("Response error");
            }

        } else {
            console.error("Unable to acess API.");
            console.error(response);
            console.error(error);
        }
    });
}

function getPlacePhoto(reference) {
        return "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference="+reference+"&key="+API_KEY;

}

var Place = function(id, name, lat, long, address, isOpen, phone, photoUrl, mapUrl, website) {
    this.id = id;
    this.name = name;
    this.lat = lat;
    this.long = long;
    this.openNow = isOpen;
    this.phone = phone;
    this.address = address
    this.photoUrl = photoUrl;
    this.mapUrl = mapUrl;
    this.website = website;
}

Place.prototype.distance = function (latitude, longitude) {
    var R = 6371e3; // metres
    var φ1 = this.lat.toRadians();
    var φ2 = latitude.toRadians();
    var Δφ = (latitude-this.lat).toRadians();
    var Δλ = (longitude-this.long).toRadians();

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = Math.floor(R * c * 100)/100;
    return d;
};

module.exports = router;
