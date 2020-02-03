'use strict'

let express = require('express')
let mongo = require('mongodb')
let mongoose = require('mongoose')

let cors = require('cors')

let app = express()

// Basic Configuration
let port = process.env.PORT || 3000

/** this project needs a db !! **/

// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors())

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'))

app.get('/', function(req, res) {
	res.sendFile(process.cwd() + '/views/index.html')
})

// your first API endpoint...
app.get('/api/hello', function(req, res) {
	res.json({ greeting: 'hello API' })
})

app.listen(port, function() {
	console.log('Node.js listening ...')
})
