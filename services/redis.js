var express = require('express');
var router = express.Router();

const fs = require('fs')
const redis = require('redis');

const redisClient = redis.createClient();

// Redis setup
function connect() {
    redisClient.connect()
        .catch((err) => {
            console.log(`Redis socket already opened`);
        });
    console.log(`Successfully connected to Redis Server`)
}

function uploadFile(fileName) {
    // Read content from the file
    const fileContent = fs.readFileSync(fileName);

    redisClient.setEx(
        fileName,
        3600,
        fileContent
    );

    console.log(`File uploaded to Redis successfully`);
}

function getFile(fileName) {
    return redisClient.get(fileName)
}

module.exports = { router, connect, uploadFile, getFile };
