const express = require('express')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

let list = ""
let listFilePath = 'public/uploads/' + Date.now() + 'list.txt'
let outputFilePath = Date.now() + '-output.mp4'

const bodyParser = require('body-parser')
const multer = require('multer')
const app = express()

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

require('dotenv').config();
const AWS = require('aws-sdk');

// S3 setup
const bucketName = "n10648046-assignment2";
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
const key = 'Videos';
const s3Key = `merger-${key}`;

//Create params for putObject call
const objectParams = { Bucket: bucketName, Key: s3Key, Body: 'Video merger' };

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



var dir = 'public';
var subDirectory = 'public/uploads'

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.mkdirSync(subDirectory)
}

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const videoFilter = function (req, file, cb) {
    // Accept videos only
    if (!file.originalname.match(/.(mp4)$/)) {
        req.fileValidationError = 'Only video files are allowed!';
        return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
};

let upload = multer({ storage: storage, fileFilter: videoFilter })

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

app.post('/merge', upload.array('files', 1000), (req, res) => {
    list = ""
    if (req.files) {
        req.files.forEach(file => {

            list += `file ${file.filename}\n`
        });

        var writeStream = fs.createWriteStream(listFilePath)
        writeStream.write(list)
        writeStream.end()

        exec(`ffmpeg -safe 0 -f concat -i ${listFilePath} -c copy ${outputFilePath}`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            else {
                console.log("Videos successfully merged.")

                res.download(outputFilePath, (err) => {
                    if (err) throw err
                    req.files.forEach(file => {
                        fs.unlinkSync(file.path)
                    });

                    fs.unlinkSync(listFilePath)
                    fs.unlinkSync(outputFilePath)
                })
            }
        })
    }
})

app.listen(PORT, () => {
    console.log(`Express app listening on Port ${PORT}`)
})