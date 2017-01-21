var request = require('request');

//polyfill
Number.prototype.toRadians = function() {
   return this * Math.PI / 180;
}

var PacesApi = function(key) {
    this.key = key;
}

PlacesApi.prototype.radar = function(param, cb) {
    request({
        uri: "https://maps.googleapis.com/maps/api/place/radarsearch/json",
        qs: {
            location: param.lat+","+param.long,
            radius: 500,
            types: param.types,
            key: this.key
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

PlacesApi.prototype.nearby = function(param, cb) {
    request({
        uri: "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        qs: {
            location: param.lat+","+param.long,
            radius: 500,
            types: param.types,
            key: this.key
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

PlacesApi.prototype.getPlaceInfos = function(placeId, cb) {
    request({
        uri: "https://maps.googleapis.com/maps/api/place/details/json",
        qs: {
            placeid: placeId,
            key: this.key
        },
        method: 'GET'
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("ok");
            body = JSON.parse(body);
            if(body.result) {
                res = body.result;
                var phUrl = getPlacePhoto(res.photos[0].photo_reference);
                if(cb) cb(new Place(res.place_id, res.name, res.geometry.location.lat, res.geometry.location.lng, res.formatted_address, res.opening_hours.open_now, res.international_phone_number, phUrl, res.url, res.website));
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

PlacesApi.prototype.updatePlaceInfos = function(place, cb) {
    request({
        uri: "https://maps.googleapis.com/maps/api/place/details/json",
        qs: {
            placeid: place.id,
            key: this.key
        },
        method: 'GET'
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("ok");
            body = JSON.parse(body);
            if(body.result) {
                res = body.result;

                place.phone = res.international_phone_number;
                place.mapUrl = res.url;
                place.website = res.website;
                place.address = res.formatted_address;

                if(cb) cb(place);
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

PlacesApi.prototype.getPlacePhoto = function(reference) {
    return "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference="+reference+"&key="+this.key;
}

//Place object class
var Place = function(id, name, lat, long, address, isOpen, photoUrl, phone, mapUrl, website) {
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

module.exports = {Place: Place, PlacesApi: PlacesApi};


function test() {
    var API_KEY = "AIzaSyB_AjPMcqwoEZtcB_EJouqH0MJfFUg6vls";

    var param = {
        lat: 48.809362,
        long: 2.365064,
        types: "food|cafe|bakery|restaurant|bar"
    };

    var api = new PlacesApi(API_KEY);

    api.radar(param, (e)=>{
        for(var i=0; i<5;i++){
            this.getPlaceInfos(e[i].place_id, (place)=>{
                console.log(place);
                console.log(place.distance(param.lat, param.long)+" m");
            });
        }
    });

    api.nearby(param, (e)=>{
        var self = this;
        e.forEach((elem)=>{
            var phUrl = self.getPlacePhoto(elem.photos[0].photo_reference);
            var place = new Place(elem.place_id, elem.name, elem.location.lat, elem.location.lng, elem.vicinity, elem.opening_hours.open_now, phUrl);
        });
    });
}

//test();
