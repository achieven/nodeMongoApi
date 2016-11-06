var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    fs = require('fs'),
    assert = require('assert');
// Connection url
var url = 'mongodb://localhost:27017/test';
// Connect using MongoClient
MongoClient.connect(url, function (err, db) {
    var express = require('express')
    var cookieParser = require('cookie-parser'),
        bodyParser = require('body-parser')
    var app = express()
    app.use(cookieParser())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: true}))
    app.listen(3000)

    app.get('/', function (req, res) {
        var html = fs.readFileSync('./index.html', 'utf8')
        res.send(html)
    })

    function getProductById(id, callback) {
        db.collection('products', function (err, products) {
            products.find().toArray(function (err, allProducts) {
                var chosenProductArray = allProducts.filter(function(product){
                    return product._id == id
                })
                if(chosenProductArray.length === 1){
                    callback(200, chosenProductArray[0])
                }
                else if (chosenProductArray.length === 0){
                    callback(400, 'No product with such id')
                }
                else {
                    callback(500, 'some problem occured')
                }
            })
        })
    }

    function getProductsByStoreId(store_id, callback){
        db.collection('products', function (err, products) {
            products.find().toArray(function (err, allProducts) {
                var chosenProductsArray = allProducts.filter(function(product){
                    return product.store_id == store_id
                })
                if(chosenProductsArray.length > 0){
                    callback(200, chosenProductsArray)
                }
                else if (chosenProductsArray.length === 0){
                    callback(400, 'No products with such store_id')
                }
                else {
                    callback(500, 'some problem occured')
                }
            })
        })
    }
    app.get('/productById', function (req, res) {
        getProductById(req.query.id, function (status, param) {
            res.status(status).send(param)
        })
    })

    app.get('/productsByStoreId', function (req, res) {
        getProductsByStoreId(req.query.store_id, function (status, param) {
            res.status(status).send(param)
        })
    })

});