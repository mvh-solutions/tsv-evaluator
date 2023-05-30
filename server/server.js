const fse = require('fs-extra')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const UUID = require("pure-uuid");


const portN = 2468
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/evaluate', express.static(path.resolve('../build')))

app.post('/submit', (req, res) => {
    let data = req.body;
    fse.writeJsonSync(path.resolve(`../evaluations/${new UUID(4)}.json`), data)
    res.send('{"status": "good"}');
})


app.listen(portN, () => {})
