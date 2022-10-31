const express = require('express')
const app = express()

const merge = require("./routes/merge");
const bodyParser = require('body-parser')


// const responseTime = require('response-time')
// const axios = require('axios');
// const redis = require('redis');

// // This section will change for Cloud Services
// // Redis setup
// const redisClient = redis.createClient();
// redisClient.connect()
//     .catch((err) => {
//         console.log(err);
//     });

// require('dotenv').config();
// const AWS = require('aws-sdk');

// // S3 setup
// const bucketName = "n10648046-assignment2";
// const s3 = new AWS.S3({ apiVersion: "2022-03-01" });
// s3.createBucket({ Bucket: bucketName })
//     .promise()
//     .then(() => console.log(`Created bucket: ${bucketName}`))
//     .catch((err) => {
//         // We will ignore 409 errors which indicate that the bucket already
//         exists
//         if (err.statusCode !== 409) {
//             console.log(`Error creating bucket: ${err}`);
//         }
//     });

// //Basic key/key - fixed here, modify for the route code
// const key = 'Videos';
// const s3Key = `merger-${key}`;

// //Create params for putObject call
// const objectParams = { Bucket: bucketName, Key: s3Key, Body: 'Video merger' };

// // Create object upload promise
// s3.putObject(objectParams)
//     .promise()
//     .then(() => {
//         console.log(
//             `Successfully uploaded data to ${bucketName}/${s3Key}`
//         );
//     })
//     .catch((err) => {
//         console.log(err, err.stack);
//     });

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/views/index.html")
})

app.post('/merge', merge)


app.listen(PORT, () => {
    console.log(`Express app listening on Port ${PORT}`)
})