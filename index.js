var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/production';
MongoClient.connect(url, function (err, db) {
    
    var express = require('express')
    var cookieParser = require('cookie-parser'),
        bodyParser = require('body-parser'),
        fs = require('fs'),
        Handlebars = require('handlebars')
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
        res.setHeader('Set-Cookie', 'auth_token=some_authentication_cookie');
        res.send(html)
    })
    
    app.get('/productById', function (req, res) {
        if(util.verifyAuthCookie(req.cookies)){
            util.getProductById(db, req.query.id, function (status, param) {
                res.status(status).send(param)
            })
        }
        else {
            res.status(403).send('You dont have auth_token')
        }
    })

    app.get('/productsByStoreId', function (req, res) {
        if(util.verifyAuthCookie(req.cookies)) {
            util.getProductsByStoreId(db, req.query.store_id, function (status, param) {
                res.status(status).send(param)
            })
        }
        else {
            res.status(403).send('You dont have auth_token')
        }
    })

    app.get('/10CheapestProducts', function(req, res){
        if(util.verifyAuthCookie(req.cookies)) {
            util.get10CheapestProducts(db, function (status, param) {
                res.status(status).send(param)
            })
        }
        else {
            res.status(403).send('You dont have auth_token')
        }
    })
    app.get('/productsByTitle', function(req, res){
        if(util.verifyAuthCookie(req.cookies)) {
            util.getProductsByTitle(db, req.query.title, req.query.partialOrExact, function (status, param) {
                res.status(status).send(param)
            })
        }
        else {
            res.status(403).send('You dont have auth_token')
        }
    })

});