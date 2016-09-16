#!/bin/env node

/**
 * Module dependencies.
 */
var express     = require('express');
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var http        = require('http');
var app         = express();

// FB variables
var VALIDATION_TOKEN = "EAAETMkfFTpEBAFZA7BCZBCP9BenhJvBlFSt0dWptKoP23dvTDqZCtxZBzcTteVIC83Ajjx7Ng1ZCDD31LH9SfMJvPGGysNDcdsw1zjtFCBowm1pHVOeBPrVoJsAlroetRXD9rODZCs8TWge7ZAgdJz3kbvnSZA6XBxa5JgzQCUGcqwZDZD";

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * Get port from environment and store in Express.
 */
var port        = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ip_address  = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

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

// Register our routes
app.use('/',router);

/**
 * Create HTTP server.
 */
app.listen(port, ip_address, function(){
    console.log('%s: Server started on %s:%d',Date(Date.now()),ip_address,port);
});