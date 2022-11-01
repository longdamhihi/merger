var express = require('express');
var router = express.Router();

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const multer = require('multer')
const s3 = require('../services/s3')
const redis = require('../services/redis')

var list = ""
var listFilePath = 'public/uploads/' + Date.now() + 'list.txt'
var outputFilePath = Date.now() + '-output.mp4'

var dir = 'public';
var subDirectory = 'public/uploads'

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

                s3.uploadFile(outputFilePath)

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