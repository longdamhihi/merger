var express = require('express');
var router = express.Router();


const axios = require('axios');
const redis = require('redis');
const app = express();

// Redis setup
function connect() {
    const redisClient = redis.createClient();
    redisClient.connect()
        .catch((err) => {
            console.log(err);
        });
    console.log(`Successfully connected to Redis Server`)
}



module.exports = { router, connect };
