var express = require('express');
var router = express.Router();

const responseTime = require('response-time')
const axios = require('axios');
const redis = require('redis');
const app = express();

// Redis setup
const redisClient = redis.createClient();
redisClient.connect()
    .catch((err) => {
        console.log(err);
    });

require('dotenv').config();
const AWS = require('aws-sdk');
// S3 setup
const bucketName = "n10648046-merger-a2";
const s3 = new AWS.S3({ apiVersion: "2022-03-01" });

s3.createBucket({ Bucket: bucketName })
    .promise()
    .then(() => console.log(`Created bucket: ${bucketName}`))
    .catch((err) => {
        // We will ignore 409 errors which indicate that the bucket already
        exists
        if (err.statusCode !== 409) {
            console.log(`Error creating bucket: ${err}`);
        }
    });

//Basic key/key - fixed here, modify for the route code
const key = 'video1';
const s3Key = `merger-${key}`;

//Create params for putObject call
const objectParams = { Bucket: bucketName, Key: s3Key, Body: 'Default' };

// Create object upload promise
s3.putObject(objectParams)
    .promise()
    .then(() => {
        console.log(
            `Successfully uploaded data to ${bucketName}/${s3Key}`
        );
    })
    .catch((err) => {
        console.log(err, err.stack);
    });

router.get("/", (req, res) => {
    const redisKey = `merger`;
    redisClient.get(redisKey).then((result) => {
        if (result) {
            console.log('Serve from Redis')
            // Serve from redis
            const resultJSON = JSON.parse(result);
            res.json({ source: "Redis Cache", ...resultJSON });
        } else {
            const params = { Bucket: bucketName, Key: redisKey };
            s3.getObject(params)
                .promise()
                .then((result) => {
                    // Serve from S3
                    const resultJSON = JSON.parse(result.Body);
                    redisClient.setEx(
                        redisKey,
                        3600,
                        JSON.stringify({ source: "Redis Cache", ...resultJSON })
                    );
                    res.json({ source: "S3 Bucket", ...resultJSON });
                }).catch((err) => {
                    console.log(err)
                    if (err.statusCode === 404) {
                        axios
                            .get(searchUrl)
                            .then((response) => {
                                const responseJSON = response.data;
                                const body = JSON.stringify(responseJSON);

                                redisClient.setEx(
                                    redisKey,
                                    3600,
                                    JSON.stringify(responseJSON)
                                );

                                const objectParams = { Bucket: bucketName, Key: redisKey, Body: body };
                                s3.putObject(objectParams)
                                    .promise()
                                    .then(() => {
                                        console.log(
                                            `Successfully uploaded data to ${bucketName}/${redisKey}`
                                        );

                                        console.log('from Wiki')
                                        res.json({ source: "Wikipedia API", ...responseJSON });
                                    });
                            })
                            .catch((err) => res.json(err));
                    } else {
                        res.json(err);
                    }
                });
        }
    });
});

module.exports = router;
