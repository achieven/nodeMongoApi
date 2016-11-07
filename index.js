var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/production';
var sha256 = require('js-sha256').sha256
MongoClient.connect(url, function (err, db) {

    var express = require('express')
    var cookieParser = require('cookie-parser'),
        bodyParser = require('body-parser'),
        fs = require('fs'),
        crypto = require('crypto'),
        util = require('./util')
    var app = express()
    app.use(cookieParser())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: true}))
    app.listen(3000, function () {
        console.log('listening on port 3000')
    })

    app.get('/', function (req, res) {
        var html = fs.readFileSync('./index.html', 'utf8')
        db.collection('auth_tokens', function (err, tokens) {
            tokens.find().toArray(function (err, auth_token) {
                if (auth_token.length === 0) {
                    crypto.randomBytes(48, function (err, buffer) {
                        var token = buffer.toString('hex');
                        tokens.insert({auth_token: sha256(token)})
                        res.setHeader('Set-Cookie', 'auth_token=' + token);
                        res.send(html)
                    });
                }
                else {
                    res.send(html) 
                }
            })
        })
    })

    app.get('/productById', function (req, res) {
        util.verifyAuthCookie(db, req.cookies, function(authorized) {
            if (authorized) {
                util.getProductById(db, req.query.id, function (status, param) {
                    res.status(status).send(param)
                })
            }
            else {
                res.status(403).send('You dont have auth_token for /productById')
            }
        })
    })

    app.get('/productsByStoreId', function (req, res) {
        util.verifyAuthCookie(db, req.cookies, function(authorized) {
            if (authorized) {
                util.getProductsByStoreId(db, req.query.store_id, function (status, param) {
                    res.status(status).send(param)
                })
            }
            else {
                res.status(403).send('You dont have auth_token for /productsByStoreId')
            }
        })
    })

    app.get('/10CheapestProducts', function (req, res) {
        util.verifyAuthCookie(db, req.cookies, function(authorized) {
            if (authorized) {
                util.get10CheapestProducts(db, function (status, param) {
                    res.status(status).send(param)
                })
            }
            else {
                res.status(403).send('You dont have auth_token for /10CheapestProducts')
            }
        })
    })
    app.get('/productsByTitle', function (req, res) {
        util.verifyAuthCookie(db, req.cookies, function(authorized) {
            if (authorized) {
                util.getProductsByTitle(db, req.query.title, req.query.partialOrExact, function (status, param) {
                    res.status(status).send(param)
                })
            }
            else {
                res.status(403).send('You dont have auth_token for /productsByTitle')
            }
        })
    })

});