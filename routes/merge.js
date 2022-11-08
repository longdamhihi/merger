var express = require('express');
var router = express.Router();

const { performance } = require('perf_hooks');
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const axios = require('axios');
const multer = require('multer')
const s3 = require('../services/s3')
const redis = require('../services/redis')

// Create variables for video merging
var list = ""
var listFilePath = 'public/uploads/' + Date.now() + 'list.txt'
var outputFilePath = Date.now() + '-output.mp4'

// Store temporal files into Public/Uploads
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

// Accept only files with the mp4 extension
const videoFilter = function (req, file, cb) {
    if (!file.originalname.match(/.(mp4)$/)) {
        req.fileValidationError = 'Only video files are allowed!';
        return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: videoFilter })

// ---------------------------------------------------------------------------------
//                      Get request used to test auto scaling 
// ----------------------------------------------------------------------------------
router.get('/merge', (req, res) => {
    res.setTimeout(0);
    var startTime = performance.now()
    exec(`ffmpeg -y -safe 0 -f concat -i ./samples/test.txt -c copy output.mp4`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        else {
            exec(`ffmpeg -y -i output.mp4 -vcodec libx264 -acodec aac output.flv`, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                else {
                    console.log("Process done.")
                    var endTime = performance.now()

                    console.log(`Took ${(endTime - startTime) / 1000} seconds`)
                    // fs.unlinkSync('output.flv')
                    fs.unlinkSync('output.mp4')
                    res.sendStatus(200)
                }
            })
            // console.log("Process done.")
            // var endTime = performance.now()

            // console.log(`Took ${endTime - startTime} milliseconds`)
            // // fs.unlinkSync('output.flv')
            // fs.unlinkSync('output.mp4')
            // res.sendStatus(200)
        }
    })

})

// ----------------------------------------------------------------------------------
//                          End get request
// ----------------------------------------------------------------------------------




// ----------------------------------------------------------------------------------
//                          Post request for regular usage
// ----------------------------------------------------------------------------------

router.post('/merge', upload.array('files', 1000), (req, res) => {
    list = ""
    if (req.files) {
        req.files.forEach(file => {
            // exec(`ffmpeg -i ${file.filename} -acodec libvo_aacenc -vcodec libx264 -s 1920x1080 -r 60 -strict experimental -c copy ${file.filename}`, (error) => {
            //     if (error) {
            //         return;
            //     }
            // })
            list += `file ${file.filename}\n`
        });

        // Create a text file containing all the filenames
        var writeStream = fs.createWriteStream(listFilePath)
        writeStream.write(list)
        writeStream.end()

        // Execute ffmpeg commands
        exec(`ffmpeg -y -safe 0 -f concat -i ${listFilePath} -c copy ${outputFilePath}`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            else {
                // Try looking for the same recently merged file in Redis
                redis.getFile(outputFilePath).then((result) => {
                    if (result) {
                        console.log('Downloading from Redis')
                        res.download(outputFilePath, (err) => {
                            if (err) throw err
                            // req.files.forEach(file => {
                            //     fs.unlinkSync(file.path)
                            // });
                            // fs.unlinkSync(listFilePath)
                            // fs.unlinkSync(outputFilePath)
                        })
                    } else {
                        // Not found in Redis
                        // Try looking for the same recently merged file in S3
                        s3.getFile(outputFilePath)
                            .promise()
                            .then((result) => {
                                console.log('Downloading from S3')
                                if (result) {
                                    res.download(outputFilePath, (err) => {
                                        if (err) throw err
                                        // req.files.forEach(file => {
                                        //     fs.unlinkSync(file.path)
                                        // });
                                        // fs.unlinkSync(listFilePath)
                                        // fs.unlinkSync(outputFilePath)
                                    })
                                }
                            }).catch((err) => {
                                // Not found in S3
                                // Download from server
                                if (err.statusCode === 404) {
                                    axios
                                    redis.uploadFile(outputFilePath)
                                    s3.uploadFile(outputFilePath)

                                    console.log("Videos successfully merged.")
                                    console.log('Downloading from server')
                                    res.download(outputFilePath, (err) => {
                                        if (err) throw err
                                        // req.files.forEach(file => {
                                        //     fs.unlinkSync(file.path)
                                        // });

                                        // fs.unlinkSync(listFilePath)
                                        // fs.unlinkSync(outputFilePath)
                                    })
                                } else {
                                    res.json(err);
                                }
                            });
                    }
                });

            }
        })
    }
});

// ----------------------------------------------------------------------------------
//                          End post request
// ----------------------------------------------------------------------------------

module.exports = router;