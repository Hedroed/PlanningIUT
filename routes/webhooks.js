var express = require('express');
var router = express.Router();
var Planning = require('../planning');
var moment = require('moment');
moment.locale("fr");
var request = require('request');
var places = require('../places');

var token = "EAAFq1GqUrIEBAELUVuua4YsHKChnbFZBip0ZAPIJbEh9bOIalrXqjVDib9YGvDg7h36VQfopGRswSoCDabRa6QCE0XoGZADfDjwOojwptzSyK4Y9OFmWGuMl2btW8ZBZAW6hj5UGz1QZBMK6TOpVYebFH2LIPX3EdOj5afYKicTAZDZD";
var API_KEY = "AIzaSyB_AjPMcqwoEZtcB_EJouqH0MJfFUg6vls";

var param = {
    lat: 48.809362, //The Machinery location
    lng: 2.365064
};

var users = {};

/* GET home page. */
router.get('/', function(req, res, next) {

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);

    console.log(req.query);

    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === "salut_je_suis_content") {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

router.post('/', function (req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            var pageID = entry.id;
            var timeOfEvent = entry.time;

            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                receivedMessage(event, req);
            });
            if(entry.messaging.length == 0){
                console.log("No message entry");
                console.log(entry);
            }
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        res.sendStatus(200);
    }
});

var askList = ["Bonjour", "Commerce", "Merci", "Aide", "Localisation"];

//Ask detection
var helloRG = new RegExp("(bonjour)|(salut)|(salutation)|(yo)|(slt)","i");
var shopRG = new RegExp("(commerce)|(magasin)|(shop)","i");
var locationRG = new RegExp("^(\\d{1,2}(?:\.?\\d+))\\s*,\\s*(-?\\d{1,3}(?:\.?\\d+))$");
var thankRG = new RegExp("merci","i");
var helpRG = new RegExp("(help)|(aide)|(aidez?-moi)","i");
var newLocationRG = new RegExp("location|localisation","i");

//postback
var shopPB = new RegExp("shop");
var detailPB = new RegExp("detail:(.*)");

var api = new places.PlacesApi(API_KEY);

function receivedMessage(event, req) {
    var senderID = event.sender.id;
    var timeOfMessage = event.timestamp;
    console.log("Received for user %d at %s", senderID, moment(+timeOfMessage).format('lll'));
    genTypingOn(senderID);

    if(event.message) {
        var message = event.message;
        var messageText = message.text;
        var messageAttachments = message.attachments;

        if (messageText) {
            // Reception d'un message text de l'utilisateur
            console.log("Type : msg");

            // reconnaissance du texte du message avec des regex
            if(helloRG.test(messageText)) {
                getUserInfo(senderID, (user)=>{
                    console.log("send greeting");
                    var title = (user.gender === "male" ? "Mr":"Mme");
                    genTextMessage(senderID, "Bonjour "+title+" "+user.first_name+" "+user.last_name, ()=>{
                        genQuickReplies(senderID, "Demandez moi quelque chose:", askList);
                    });
                });
            } else if(shopRG.test(messageText)) {
                // genTextMessage(senderID, "Pas ci vite mon petit kinder");
                shopInfo(senderID);

            } else if(helpRG.test(messageText)) {
                genQuickReplies(senderID, "Je peux vous montré les commerces proche de vous: ", ["Commerce"]);

            } else if(thankRG.test(messageText)) {
                genTextMessage(senderID, "Se fut un plaisir de discuter avec vous");
            } else if(locationRG.test(messageText)) {
                var ret = locationRG.exec(messageText);
                var lat = ret[1];
                var lng = ret[2];
                console.log("New location %s, %s", lat, lng);
                userLocation(senderID, lat, lng);
                console.log(users[senderID]);
                genTextMessage(senderID, "Vous êtes en "+lat+", "+lng);
                shopInfo(senderID);
            
            } else if(newLocationRG.test(messageText)) {
                //console.log("new location "+senderID);
                genLocationMessage(senderID);
            } else {
                genQuickReplies(senderID, "Qu'avez vous voulu dire ?", askList);
            }

        } else if (messageAttachments) {
            //Reception d'un message piece jointe
            //Potentiellement les coordonées de l'utilisateur via Messenger

            console.log("Type : attachment");
            
            if(message.attachments[0].type === "location") {
                var loc = message.attachments[0].payload.coordinates;
                userLocation(senderID, loc.lat, loc.long);
                shopInfo(senderID);
            }
            
            // genTextMessage(senderID, "Message with attachment received");
        }

    } else if(event.postback){
        //reception d'un click de bouton postback "plus de detail" ou "commerce"
        console.log("Type : postback");
        var postback = event.postback;

        if(shopPB.test(postback.payload)) {
            console.log("postback shop");
            shopInfo(senderID);

        } else if(detailPB.test(postback.payload)) {
            console.log("postback detail");
            var placeId = detailPB.exec(postback.payload)[1];
            console.log("place "+placeId);
            var placeDetail = api.getPlaceInfos(placeId, (placeDetail)=>{
                genPlaceMessage(senderID, placeDetail, param);
            });

        } else {
            genQuickReplies(senderID, "Qu'avez vous voulu dire ?", askList);
        }

    } else {
        //message inconnu, proposition des message pertinent
        console.log("quick replies");
        genQuickReplies(senderID, "Qu'avez vous voulu dire ?", askList);
    }

    function shopInfo(userId) {
        console.log("shop info "+userId);
        if(users[userId]) {
            console.log(users[userId]);
            api.nearby(users[userId], (nearPlaces)=>{
                displayPlaces = [];
                var max = Math.min(4,nearPlaces.length);
                for(var i=0; i<max;i++){
                    var phUrl = undefined;
                    var open;
                    if(nearPlaces[i].photos)
                        phUrl = api.getPlacePhoto(nearPlaces[i].photos[0].photo_reference);
                    if(nearPlaces[i].opening_hours)
                        open = nearPlaces[i].opening_hours.open_now;
                        
                    displayPlaces.push(new places.Place(nearPlaces[i].place_id, nearPlaces[i].name, nearPlaces[i].geometry.location.lat, nearPlaces[i].geometry.location.lng, nearPlaces[i].vicinity, open, phUrl));
                }
                genPlacesListMessage(userId, displayPlaces);
            });
        } else {
            genLocationMessage(userId);
        }
    }
    
    function userLocation(userId, lat, lng) {
        if(!users[userId]) {
            users[userId] = {};
        }
        users[userId].lat = lat;
        users[userId].lng = lng;
    }
}

function genTextMessage(recipientId, messageText, cb) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData, cb);
}

function genPlacesListMessage(recipientId, places, cb) {
    if(places.length > 4) throw "Too many places max is 4";

    var elems = [];
    for(place of places) {
        elems.push({
            title: place.name,
            image_url: place.photoUrl,
            subtitle: place.address,
            default_action: {
                type: "web_url",
                url: api.getMapUrl(place),
                messenger_extensions: false,
                webview_height_ratio: "tall"
            },
            buttons: [
                {
                    title: "Plus de détails",
                    type: "postback",
                    payload: "detail:"+place.id
                }
            ]
        });
    }

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "list",
                    top_element_style: "compact",
                    elements: elems
                    // ,
                    // buttons: [
                    //     {
                    //         title: "View More",
                    //         type: "postback",
                    //         payload: "payload"
                    //     }
                    // ]
                }
            }
        }
    };

    callSendAPI(messageData, cb);
}

function genPlaceMessage(recipientId, place, userLocation, cb) {
    var openState = place.openNow ? "Actuellement ouvert" : "Fermer";

    var buttons = [];
    if(place.website) {
        buttons.push({
            type: "web_url",
            url: place.website,
            title: "Site Web"
        });
    }
    if(place.mapUrl) {
        buttons.push({
            type: "web_url",
            url: place.mapUrl,
            title: "Distance:"+place.distance(userLocation.lat, userLocation.lng)+"m"
        });
    }
    if(place.phone) {
        buttons.push({
            title: "Téléphoner",
            type: "phone_number",
            payload: place.phone
        });
    }

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [
                        {
                            title: place.name,
                            image_url: place.photoUrl,
                            subtitle: place.address+", "+openState,
                            default_action: {
                                type: "web_url",
                                url: place.mapUrl,
                                webview_height_ratio: "tall",
                                // messenger_extensions: true,
                                // fallback_url: "https://peterssendreceiveapp.ngrok.io/"
                            },
                            buttons: buttons
                        }
                    ]
                }
            }
        }
    };
    callSendAPI(messageData, cb);
}

function genImageMessage(recipientId, imageUrl, cb) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment:{
                type:"image",
                payload:{
                    url:imageUrl
                }
            }
        }
    };
    callSendAPI(messageData, cb);
}

function genLocationMessage(recipientId, cb) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "Il me faut votre localisation, vous pouvez aussi tapez directement vos coordonnées :",
            quick_replies: [
            {
                content_type:"location"
            }]
        }
    };
    callSendAPI(messageData, cb);
}

function genQuickReplies(recipientId, title, texts, cb) {
    var replies = [];
    for(text of texts) {
        replies.push({
          content_type:"text",
          title: text,
          payload:"quick_replies"
        });
    }

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: title,
            quick_replies:replies
        }
    };

    callSendAPI(messageData, cb);
}

function genTypingOn(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    callSendAPI(messageData);
}

function callSendAPI(messageData, cb) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent message id %s to %s",
        messageId, recipientId);
        if(cb) cb();
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

function getUserInfo(userId, cb) {
    if(!cb) throw "no callback";

    request({
        uri: 'https://graph.facebook.com/v2.6/'+userId,
        qs: {
            fields: "first_name,last_name,profile_pic,gender,locale",
            access_token: token
        },
        method: 'GET'
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          cb(JSON.parse(body));

        } else {
          console.error("Unable to get user info.");
          console.error(response);
          console.error(error);
        }
    });
}

module.exports = router;
