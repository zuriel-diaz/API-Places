#!/bin/env node

/**
 * Module dependencies.
 */
var express     = require('express');
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var http        = require('http');
var app         = express();

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
        res.json({ message: 'waiting...' });
    })
    .post(function(req,res){
        res.json({ message: 'ok...' });
    });

// Register our routes
app.use('/',router);

/**
 * Create HTTP server.
 */
app.listen(port, ip_address, function(){
    console.log('%s: Server started on %s:%d',Date(Date.now()),ip_address,port);
});