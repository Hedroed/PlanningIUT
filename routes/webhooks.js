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
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
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

var courseRegex = new RegExp('^courses? ([1,2][A-D][1,2])$', 'i');
function receivedMessage(event, req) {
    var senderID = event.sender.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    console.log("Received for user %d at %s msg :",
    senderID, moment(+timeOfMessage).format('lll'));
    console.log(JSON.stringify(message));

    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
        var match = courseRegex.exec(messageText);
        if(match[1]) {
            //parse group
            var param = match[1];
            var paramInfo = param.substring(0,1);
            var paramGroup = param.substring(1);
            var group = [param, param.substring(0,param.length-1), paramInfo];
            var plan = (paramInfo === "1" ? req.planInfo1 : req.planInfo2);
            console.log(group);
            var courses = plan.getCourses(group, true, 1);
            console.log(courses);

        } else {
            getUserInfo(senderID, (user)=>{
                var title = (user.gender === "male" ? "Mr":"Mme");
                callSendAPI(genTextMessage(senderID, "Bonjour "+title+" "+user.first_name+" "+user.last_name));
            });
        }

    } else if (messageAttachments) {
        callSendAPI(genTextMessage(senderID, "Message with attachment received"));
    }
}

function genTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    return messageData;
}

function genImageMessage(recipientId, imageUrl) {
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

    return messageData;
}

function callSendAPI(messageData) {
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
