var express = require('express');
var router = express.Router();
var Planning = require('../planning');
var moment = require('moment');
moment.locale("fr");
var request = require('request');

var token = "EAAFq1GqUrIEBAELUVuua4YsHKChnbFZBip0ZAPIJbEh9bOIalrXqjVDib9YGvDg7h36VQfopGRswSoCDabRa6QCE0XoGZADfDjwOojwptzSyK4Y9OFmWGuMl2btW8ZBZAW6hj5UGz1QZBMK6TOpVYebFH2LIPX3EdOj5afYKicTAZDZD";

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
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        res.sendStatus(200);
    }
});

var askList = ["Bonjour", "Commerce", "Merci", "Aide"];

//Ask detection
var helloRG = new RegExp("(bonjour)|(salut)|(salutation)|(yo)","i");
var shopRG = new RegExp("(commerce)|(magasin)","i");
var locationRG = new RegExp("^(\\d{1,2}(?:\.?\\d+))\\s*,\\s*(-?\\d{1,3}(?:\.?\\d+))$");
var thankRG = new RegExp("merci","i");
var helpRG = new RegExp("(help)|(aide)|(aidez-moi)","i");

//postback
var shopPB = "shop";
var detailPB = "detail";

function receivedMessage(event, req) {
    var senderID = event.sender.id;
    var timeOfMessage = event.timestamp;
    console.log("Received for user %d at %s", senderID, moment(+timeOfMessage).format('lll'));

    if(event.message) {
        var message = event.message;
        var messageText = message.text;
        var messageAttachments = message.attachments;

        if (messageText) {
            // Reception d'un message text de l'utilisateur
            console.log("Type : msg");

            // reconnaissance du texte du message avec des regex
            if(helloRG.test(messageText) {
                getUserInfo(senderID, (user)=>{
                    console.log("send greeting");
                    var title = (user.gender === "male" ? "Mr":"Mme");
                    genTextMessage(senderID, "Bonjour "+title+" "+user.first_name+" "+user.last_name, ()=>{
                        genQuickReplies(senderID, "Demandez moi quelque chose:", askList);
                    });
                });
            } else if(shopRG.test(messageText)) {
                genTextMessage(senderID, "Pas ci vite mon petit kinder");
                // genLocationMessage(senderID);
                // genPlaceMessage(senderID, {})

            } else if(helpRG.test(messageText)) {
                genQuickReplies(senderID, "Je peux vous montré les commerces proche de vous: ", ["Commerce"]);

            } else if(thankRG.test(messageText)) {
                genTextMessage(senderID, "Se fut un plaisir de discuter avec vous");
            } else if(locationRG.test(messageText)) {
                var ret = locationRG.exec(messageText);
                var lat = ret[1];
                var lng = ret[2];
                console.log("New location %s, %s", lat, lng);
                genTextMessage(senderID, "Vous êtes en "+lat+", "+lng);
            } else {
                genQuickReplies(senderID, "Qu'avez vous voulu dire ?", askList);
            }

        } else if (messageAttachments) {
            //Reception d'un message piece jointe
            //Potentiellement les coordonées de l'utilisateur via Messenger

            console.log("Type : attachment");
            console.log(message);
            // genTextMessage(senderID, "Message with attachment received");
        }

    } else if(event.postback){
        //reception d'un click de bouton postback "plus de detail" ou "commerce"

        var postback = event.postback;
        console.log("Type : postback");

    } else {
        //message inconnu, proposition des message pertinent
        console.log("quick replies");
        genQuickReplies(senderID, "Qu'avez vous voulu dire ?", askList);
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

    var elems = [];
    for(place of places) {
        elems.push({
            title: place.name,
            image_url: place.photoUrl,
            subtitle: place.address,
            default_action: {
                type: "web_url",
                url: place.mapUrl,
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                // fallback_url: "https://peterssendreceiveapp.ngrok.io/"
            },
            buttons: [
                {
                    title: "Plus de détails",
                    type: "postback",
                    payload: place.id
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
                    elements: elems,
                    buttons: [
                        {
                            title: "View More",
                            type: "postback",
                            payload: "payload"
                        }
                    ]
                }
            }
        }
    };

    callSendAPI(messageData, cb);
}

function genPlaceMessage(recipientId, place, userLocation, cb) {
    var openState = place.openNow ? "Actuellement ouvert" : "Fermer";

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
                            subtitle: place.address+", "+openState+", "+place.distance(userLocation.lat, userLocation.lng),
                            default_action: {
                                type: "web_url",
                                url: place.mapUrl,
                                webview_height_ratio: "tall",
                                // messenger_extensions: true,
                                // fallback_url: "https://peterssendreceiveapp.ngrok.io/"
                            },
                            buttons: [
                                {
                                    type: "web_url",
                                    url: place.mapUrl,
                                    title: "Voir sur Maps"
                                },
                                {
                                    title: "Téléphoner",
                                    type: "phone_number",
                                    payload: place.phone
                                },
                                {
                                    type: "web_url",
                                    url: place.website,
                                    title: "Site Web"
                                }
                            ]
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
            text: "Donner votre position:",
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

function genTypingOn(recipientId, messageText) {
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
