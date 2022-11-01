const express = require('express')
const app = express()

const merge = require("./routes/merge")
const s3 = require('./services/s3')
const redis = require('./services/redis')
const bodyParser = require('body-parser')

var AWS = require("aws-sdk");
var awsConfig = {
    region: "ap-southeast-2",
    endpoint: process.env.AWS_ENDPOINT,
    accessKeyId: process.env.AWS_KEYID,
    secretAccessKey: process.env.AWS_SECRETKEY,
};
AWS.config.update(awsConfig);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    redis.connect()
    s3.connect()
    res.sendFile(__dirname + "/views/index.html")
})

app.post('/merge', merge);

app.listen(PORT, () => {
    console.log(`Express app listening on Port ${PORT}`)
})