#!/bin/env node

/**
 * Module dependencies.
 */
var express     = require('express');
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var http        = require('http');
var request     = require('request');
var fs          = require('fs');
var app         = express();

// FB variables
var VALIDATION_TOKEN    = "EAAETMkfFTpEBAFZA7BCZBCP9BenhJvBlFSt0dWptKoP23dvTDqZCtxZBzcTteVIC83Ajjx7Ng1ZCDD31LH9SfMJvPGGysNDcdsw1zjtFCBowm1pHVOeBPrVoJsAlroetRXD9rODZCs8TWge7ZAgdJz3kbvnSZA6XBxa5JgzQCUGcqwZDZD";
var PAGE_ACCESS_TOKEN   = "EAAETMkfFTpEBAOjpC5ZCvpZCp9LmGT2MUWBpNwUwrIgWZBPY07brCbzSjXKGeVK8eUVDp4hUd4SJuQRrFJMLIWpCaEWh38bk2ZCuhKTZAK2roY7EUYokbSJdTAcmwykkyZAn1DWCbRMpstzDSVxIAiIK1R7EnazvSHy3DfZA8Xh0wZDZD";

var STORE_PATH          = '/locations/places/tiendas.json';
var RESTAURANTS_PATH    = '/locations/places/restaurantes.json';

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * Get port from environment and store in Express.
 */
var port        = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ip_address  = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageId = message.mid;

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        switch (messageText) {
          case 'image':
            sendImageMessage(senderID);
            break;

          case 'button':
            sendButtonMessage(senderID);
            break;

          case 'generic':
            sendGenericMessage(senderID);
            break;

          case 'receipt':
            sendReceiptMessage(senderID);
            break;

          default:
            sendTextMessage(senderID, messageText);
        }
    } 
    else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}

function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}

function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });  
    console.log('message data:' + JSON.stringify(messageData));
}

/*
 * Routing
 */
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do something
    next();
});

// Routes
router.get('/', function(req, res) {
    res.json({ message: 'API v0.5!' });   
});

/*
router.route('/webhook')
    .get(function(req,res){
        if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
            console.log("Validating webhook");
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error("Failed validation. Make sure the validation tokens match.");
            res.sendStatus(403);          
        }  
    })
    .post(function(req,res){
        var data = req.body;
        // Make sure this is a page subscription
        if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function(messagingEvent) {
                if (messagingEvent.optin) {
                    receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                  receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                  receivedPostback(messagingEvent);
                } else {
                  console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've 
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
        }
    });
*/
router.route('/api/places/:type')
    .get(function(req,res){
        //console.log('URI->/api/places/ | param:'+req.params.type);
        //res.json({ message: '/api/places/:type' }); 
        var obj = JSON.parse(fs.readFileSync(RESTAURANTS_PATH,'utf-8'));
        console.log(obj);
        res.json({ message: '/api/places/:type' });
    });

// Register our routes
app.use('/',router);

/**
 * Create HTTP server.
 */
app.listen(port, ip_address, function(){
    console.log('%s: Server started on %s:%d',Date(Date.now()),ip_address,port);
});