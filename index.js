const express = require('express')
const app = express()

const merge = require("./routes/merge")
const s3 = require('./services/s3')
const redis = require('./services/redis')
const bodyParser = require('body-parser')

// Update AWS configs
var AWS = require("aws-sdk");
var awsConfig = {
    region: "ap-southeast-2",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
};
AWS.config.update(awsConfig);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))

const PORT = process.env.PORT || 8000

// Home page
app.get('/', (req, res) => {
    redis.connect()
    s3.connect()
    res.sendFile(__dirname + "/views/index.html")
})

// Get /merge endpoint for auto testing
app.post('/merge', merge);

// Post /merge endpoint for videos merging
app.get('/merge', merge);

app.listen(PORT, () => {
    console.log(`Express app listening on Port ${PORT}`)
})