var express = require('express');
var router = express.Router();

const responseTime = require('response-time')
const axios = require('axios');
const redis = require('redis');

// This section will change for Cloud Services
// Redis setup
const redisClient = redis.createClient();
redisClient.connect()
    .catch((err) => {
        console.log(err);
    });

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;
