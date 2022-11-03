var express = require('express');
var router = express.Router();

const fs = require('fs')
require('dotenv').config();
const AWS = require('aws-sdk');

// S3 setup
const bucketName = "n10648046-merger-a2";
const s3 = new AWS.S3({ apiVersion: "2022-03-01" });

function connect() {
    s3.createBucket({ Bucket: bucketName })
        .promise()
        .then(() => console.log(`Successfully connected to S3 bucket: ${bucketName}`))
        .catch((err) => {
            // We will ignore 409 errors which indicate that the bucket already exists
            if (err.statusCode !== 409) {
                console.log(`Error creating bucket: ${err}`);
            }
        });
}

function uploadFile(fileName) {
    // Read content from the file
    const fileContent = fs.readFileSync(fileName);

    // Setting up S3 upload parameters
    const params = {
        Bucket: bucketName,
        Key: fileName, // File name you want to save as in S3
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};

function getFile(fileName) {
    const params = { Bucket: bucketName, Key: fileName };

    return s3.getObject(params)
}

module.exports = { router, uploadFile, connect, getFile };