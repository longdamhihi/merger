var express = require('express');
var router = express.Router();

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const multer = require('multer')
var list = ""
var listFilePath = 'public/uploads/' + Date.now() + 'list.txt'
var outputFilePath = Date.now() + '-output.mp4'

var dir = 'public';
var subDirectory = 'public/uploads'

require('dotenv').config();
const AWS = require('aws-sdk');
// S3 setup
const bucketName = "n10648046-merger-a2";
const s3 = new AWS.S3({ apiVersion: "2022-03-01" });

s3.createBucket({ Bucket: bucketName })
    .promise()
    .then(() => console.log(`Created bucket: ${bucketName}`))
    .catch((err) => {
        // We will ignore 409 errors which indicate that the bucket already exists
        if (err.statusCode !== 409) {
            console.log(`Error creating bucket: ${err}`);
        }
    });

const uploadFile = (fileName) => {
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

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.mkdirSync(subDirectory)
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const videoFilter = function (req, file, cb) {
    // Accept only files with the mp4 extension
    if (!file.originalname.match(/.(mp4)$/)) {
        req.fileValidationError = 'Only video files are allowed!';
        return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: videoFilter })

router.post('/merge', upload.array('files', 1000), (req, res) => {
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

                uploadFile(outputFilePath)

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
});

module.exports = router;