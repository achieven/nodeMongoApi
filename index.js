var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/production';
MongoClient.connect(url, function (err, db) {
    
    var express = require('express')
    var cookieParser = require('cookie-parser'),
        bodyParser = require('body-parser'),
        fs = require('fs'),
        util = require('./util')
    var app = express()
    app.use(cookieParser())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: true}))
    app.listen(3000, function(){
        console.log('listening on port 3000')
    })

    app.get('/', function (req, res) {
        var html = fs.readFileSync('./index.html', 'utf8')
        res.send(html)
    })
    
    app.get('/productById', function (req, res) {
        util.getProductById(db, req.query.id, function (status, param) {
            res.status(status).send(param)
        })
    })

    app.get('/productsByStoreId', function (req, res) {
        util.getProductsByStoreId(db, req.query.store_id, function (status, param) {
            res.status(status).send(param)
        })
    })

    app.get('/10CheapestProducts', function(req, res){
        util.get10CheapestProducts(db, function(status, param){
            res.status(status).send(param)
        })
    })
    app.get('/productsByTitle', function(req, res){
        util.getProductsByTitle(db, req.query.title, req.query.partialOrExact, function(status, param){
            res.status(status).send(param)
        })
    })

});