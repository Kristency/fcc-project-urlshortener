'use strict'

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const DNS = require('dns') // to validate the incoming urls
const cors = require('cors')

const app = express()
require('dotenv').config()

// requiring models
const Url = require('./models/url')

// Basic Configuration
const port = process.env.PORT || 3000

/** this project needs a db !! **/

mongoose.connect(process.env.DATABASEURL || 'mongodb://localhost:27017/url-shortener', {
	useNewUrlParser: true
})
// mongoose.connect('mongodb://localhost:27017/url-shortener', {
// 	useNewUrlParser: true
// })

app.use(cors())

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/public', express.static(process.cwd() + '/public'))

app.get('/', (req, res) => {
	res.sendFile(process.cwd() + '/views/index.html')
})

// using base62 conversion to generate an alphanumeric short_url
let COUNTER = 0

function base62_encode(deci) {
	let s = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
	if (deci === 0) {
		return '0'
	}
	let hash_str = ''
	while (deci > 0) {
		hash_str += s[deci % 62]
		deci = parseInt(deci / 62)
	}
	return hash_str
}

// maintaining a counter for the number to be converted to base62(26 lowercase alphabets + 26 uppercase albhabets + 10 numbers)
// with a counter, there is no need to check db first for collisions.
// assuming length of generated short_url will be 7, so input will be a 7 digit long number, padded with zeroes if required.

// This method is scalable as we can use Zookeeper to manage the counters on distributed servers.

// post endpoint with long_url
app.post('/api/shorturl/new', (req, res) => {
	let input_url = req.body.url
	if (/^(https:)?\/\/(www\.)?[a-zA-Z0-9-_]+\.{1}\S{2,}[a-zA-Z0-9-_/]*/.test(input_url)) {
		let REPLACE_REGEX = /^https?:\/\//i
		// preparing the url to pass to dns lookup
		let dns_formatted_input_url = input_url.replace(REPLACE_REGEX, '')
		DNS.lookup(dns_formatted_input_url, (err, address, family) => {
			if (err) {
				res.json({ error: 'invalid URL' })
			} else {
				// first checking if input_url already exist in db, then no need to generate new, return
				// the found short_url
				Url.findOne({ original_url: input_url }, (err, foundUrl) => {
					if (err) {
						console.log(err)
					} else if (foundUrl) {
						res.json(foundUrl)
					} else {
						let deci = parseInt(COUNTER.toString().padStart(7, 0))
						COUNTER += 1
						let short_url = base62_encode(deci)
						console.log(short_url, deci)
						Url.create({ original_url: input_url, short_url }, (err, createdUrl) => {
							if (err) {
								console.log(err)
							} else {
								res.json(createdUrl)
							}
						})
					}
				})
			}
		})
	} else {
		res.json({ error: 'invalid URL' })
	}
})

// get endpoint with short_url
app.get('/api/shorturl/:short_url', (req, res) => {
	let short_url = req.params.short_url
	Url.findOne({ short_url }, (err, foundUrl) => {
		if (err) {
			console.log(err)
		} else if (foundUrl) {
			res.redirect(foundUrl.original_url)
		} else {
			res.json({ error: 'invalid URL' })
		}
	})
})

app.listen(port, () => {
	console.log('Node.js listening ...')
})
