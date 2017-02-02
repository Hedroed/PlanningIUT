var express = require('express');
var router = express.Router();
var moment = require('moment');
moment.locale("fr");
var request = require('request');
var places = require('../places');

//api key
var MESSENGER_API_KEY = "EAAFq1GqUrIEBAELUVuua4YsHKChnbFZBip0ZAPIJbEh9bOIalrXqjVDib9YGvDg7h36VQfopGRswSoCDabRa6QCE0XoGZADfDjwOojwptzSyK4Y9OFmWGuMl2btW8ZBZAW6hj5UGz1QZBMK6TOpVYebFH2LIPX3EdOj5afYKicTAZDZD";
var GOOGLE_API_KEY = "AIzaSyB_AjPMcqwoEZtcB_EJouqH0MJfFUg6vls";
var MESSENGER_API_KEY_2 = "EAAFq1GqUrIEBAMKYZCIZBoojZCVQ4yprnH98Bpml8wYbmsQmSzXuGCjbmiNY0BNVuTBLz4HaQide8mBD7gGUZAysweVY6G0GlItcM4ZBKncfPGMDspDtbiuI3WDDXcOmlp961GfCmEBAPjZAWYL632Yzq5xP7QadZCmZCcsSfFQsuwZDZD";

// constante
var askList = ["Recherche", "Commerce", "Localisation", "Aide", "Merci", "Bonjour"];
var api = new places.PlacesApi(GOOGLE_API_KEY);
var users = {};

/* GET home page. */
router.get('/', function(req, res, next) {
    //Vérification de la page par facebook
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === "marchepasmarchepasmarchepasmarchepasmarchepasmarchepas") {
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

        res.sendStatus(200);
    }
});

//Get regex param from config file "trigger.cf"
var trigger = require('../trigger.json');

//Ask detection
var helloRG = new RegExp(trigger.text.hello,"i");
var shopRG = new RegExp(trigger.text.shop,"i");
var locationRG = new RegExp(trigger.text.coordinates);
var thankRG = new RegExp(trigger.text.thank,"i");
var helpRG = new RegExp(trigger.text.help,"i");
var newLocationRG = new RegExp(trigger.text.newLocation,"i");
var searchRG = new RegExp(trigger.text.search, "i");

//postback
var shopPB = new RegExp(trigger.postback.shop);
var detailPB = new RegExp(trigger.postback.detail);

function receivedMessage(event, req) {
    var senderID = event.sender.id;
    var timeOfMessage = event.timestamp;
    console.log("Received for user %d at %s", senderID, moment(+timeOfMessage).format('lll'));
    console.log(event.recipient.id);
    var fbKey = event.recipient.id === "1765095850483565" ? MESSENGER_API_KEY_2 : MESSENGER_API_KEY;

    if(event.message) {
        var message = event.message;
        var messageText = message.text;
        var messageAttachments = message.attachments;

        if (messageText) {
            // Reception d'un message text de l'utilisateur
            console.log("Type : msg");

            // reconnaissance du texte du message avec des expressions régiliéres
            if(helloRG.test(messageText)) {
                getUserInfo(senderID, fbKey, (user)=>{
                    console.log("send greeting");
                    var title = (user.gender === "male" ? "Mr":"Mme");
                    genTextMessage(senderID, "Bonjour "+title+" "+user.first_name+" "+user.last_name, fbKey, ()=>{
                        genQuickReplies(senderID, "Demandez moi quelque chose :", askList, fbKey);
                    });
                });

            } else if(shopRG.test(messageText)) {
                // Cheche les information de lieu à proximité
                shopInfo(senderID);

            } else if(helpRG.test(messageText)) {
                genQuickReplies(senderID, "Je peux vous montrer les commerces proches de vous. Vous pouvez également rechercher des lieux en envoyant \"recherche\" + le nom du lieu", ["Commerce", "Recherche", "Localisation"], fbKey);

            } else if(thankRG.test(messageText)) {
                genTextMessage(senderID, "Ce fut un plaisir de discuter avec vous", fbKey);
                genImageMessage(senderID, "https://scontent.xx.fbcdn.net/t39.1997-6/p100x100/851586_126361877548609_1351776047_n.png?_nc_ad=z-m", fbKey);

            } else if(locationRG.test(messageText)) {
                //Récuperation des coordonnées en mode text
                var ret = locationRG.exec(messageText);
                var lat = ret[1];
                var lng = ret[2];
                console.log("New location %s, %s", lat, lng);
                if(userLocation(senderID, lat, lng)) {
                    genTextMessage(senderID, "Vous êtes en "+lat+", "+lng, fbKey);
                    shopInfo(senderID);
                } else {
                    genTextMessage(senderID, "Coordonnées incorrect", fbKey);
                }

            } else if(newLocationRG.test(messageText)) {
                //Demande de localisation
                genLocationMessage(senderID, fbKey);
            } else if(searchRG.test(messageText)) {

                var query = searchRG.exec(messageText)[1];

                if(query) {
                    genTypingOn(senderID, fbKey); //Indique que la réponse en cour de traitement

                    //Recherche du lieu avec google places api
                    api.text(query, (resPlaces)=>{
                        //console.log("place récuperer "+resPlaces.length);
                        if(resPlaces.length <= 0) {
                            genTextMessage(senderID, "Aucun résultat !", fbKey);
                        } else if(resPlaces.length == 1){
                            //S'il n'y a qu'un resultat on affiche directement les information détaillées
                            api.getPlaceInfos(resPlaces[0].place_id, (placeDetail)=>{
                                genPlaceMessage(senderID, placeDetail, users[senderID], fbKey);
                            });
                        } else {
                            displayPlaces = [];
                            var max = Math.min(4,resPlaces.length);
                            for(var i=0; i<max;i++){
                                var phUrl = undefined;
                                var open;
                                if(resPlaces[i].photos) phUrl = api.getPlacePhoto(resPlaces[i].photos[0].photo_reference);
                                if(resPlaces[i].opening_hours) open = resPlaces[i].opening_hours.open_now;

                                displayPlaces.push(new places.Place(resPlaces[i].place_id, resPlaces[i].name, resPlaces[i].geometry.location.lat, resPlaces[i].geometry.location.lng, resPlaces[i].formatted_address, open, phUrl));
                            }
                            genPlacesListMessage(senderID, displayPlaces, fbKey);
                        }
                    });
                } else {
                    genTextMessage(senderID, "Pour faire une recherche tapez \"recherche\" + le nom du lieu", fbKey);
                }

            } else {
                genQuickReplies(senderID, "Qu'avez vous voulu dire ?", askList, fbKey);

            }

        } else if (messageAttachments) {
            //Reception d'un message piece jointe
            //Potentiellement les coordonées de l'utilisateur envoyer via Messenger
            console.log("Type : attachment");
            if(message.attachments[0].type === "location") {
                var loc = message.attachments[0].payload.coordinates;
                userLocation(senderID, loc.lat, loc.long);
                shopInfo(senderID);
            } else {
                console.log(message.attachments[0]);
            }

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
            api.getPlaceInfos(placeId, (placeDetail)=>{
                genPlaceMessage(senderID, placeDetail, users[senderID], fbKey);
            });

        } else {
            genQuickReplies(senderID, "Qu'avez vous voulu dire ?", askList, fbKey);

        }
    } else {
        //message inconnu, proposition des message pertinents
        console.log("quick replies");
        genQuickReplies(senderID, "Qu'avez vous voulu dire ?", askList, fbKey);
    }

    //Vérifie s'il on connait les coordonnées de l'utilisateur
    //Cherche les magasins à proximité
    function shopInfo(userId) {
        if(users[userId]) {
            genTypingOn(senderID, fbKey); //Indique que la réponse en cour de traitement
            //On connait les coordonnées et on récupere les lieux autours de ces coordonnées dans un rayon de 500m
            api.nearby(users[userId], (nearPlaces)=>{

                if(nearPlaces.length <= 0) {
                    genTextMessage(senderID, "Aucun résultat !", fbKey);
                } else if(nearPlaces.length == 1){
                    //S'il n'y a qu'un resultat on affiche directement les information détaillées
                    api.getPlaceInfos(nearPlaces[0].place_id, (placeDetail)=>{
                        genPlaceMessage(senderID, placeDetail, users[senderID], fbKey);
                    });
                } else {
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
                    genPlacesListMessage(userId, displayPlaces, fbKey);
                }
            });
        } else {
            // Demande de coordonnées
            genLocationMessage(userId, fbKey);
        }
    }

    //Enregistrement des coordonnées de l'utilisateur
    function userLocation(userId, lat, lng) {
        lat = +lat;
        lng = +lng;
        if(lat > 90 || lat < -90 || lng > 180 || lng < -180) return false;

        if(!users[userId]) {
            users[userId] = {};
        }
        users[userId].lat = +lat;
        users[userId].lng = +lng;

        // Evite un trop plein du tableau d'utilisateur
        if(users.length > 50) {
            users.shift();
        }
        return true;
    }
}

//Envoi un message text
function genTextMessage(recipientId, messageText, key, cb) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData, key, cb);
}

//Envoi un template de liste de places
function genPlacesListMessage(recipientId, places, key, cb) {
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
                }
            }
        }
    };
    //console.dir(messageData.message.attachment.payload);

    callSendAPI(messageData, key, cb);
}

//Envoi un template de place détaillé
function genPlaceMessage(recipientId, place, userLocation, key, cb) {
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
        if(userLocation) {
            buttons.push({
                type: "web_url",
                url: place.mapUrl,
                title: "Distance : "+place.distance(userLocation.lat, userLocation.lng)
            });
        } else {
            buttons.push({
                type: "web_url",
                url: place.mapUrl,
                title: "Voir sur Map"
            });
        }
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
    callSendAPI(messageData, key, cb);
}

//Envoi une image
function genImageMessage(recipientId, imageUrl, key, cb) {
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
    callSendAPI(messageData, key, cb);
}

//Envoi une demande de localisation
function genLocationMessage(recipientId, key, cb) {
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
    callSendAPI(messageData, key, cb);
}

//Envoi des reponses rapides
function genQuickReplies(recipientId, title, texts, key, cb) {
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

    callSendAPI(messageData, key, cb);
}

//Envoi l'evenement "En train d'écrire"
function genTypingOn(recipientId, key) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    callSendAPI(messageData, key);
}

//Appele à l'API Messenger d'envoi de message
function callSendAPI(messageData, key, cb) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: key },
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
    //   console.error(response.request.url);
      console.error(error);
    }
  });
}

//Récupere les information d'un utilisateur via son ID par l'API facebook
function getUserInfo(userId, key, cb) {
    if(!cb) throw "no callback";

    request({
        uri: 'https://graph.facebook.com/v2.6/'+userId,
        qs: {
            fields: "first_name,last_name,profile_pic,gender,locale",
            access_token: key
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
