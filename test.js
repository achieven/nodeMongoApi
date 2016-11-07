var util = require('./util')
var expect = require('chai').expect
var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient
var ObjectID = mongodb.ObjectID
var sha256 = require('js-sha256').sha256

var url = 'mongodb://localhost:27017/test';
describe('getProductById', function () {
    it('should return status 200 when no product with such id exists', function (done) {
        MongoClient.connect(url, function (err, db) {
            util.getProductById(db, 'some id that doesnt exist', function (status, param) {
                expect(status).to.be.equal(200)
                expect(param).to.be.equal('No product with such id exists')
                db.close()
                done()
            })
        })
    })
    it('should return status 200 when ObjectID(id) equals the id in the database or ObjectID(id in database) equals id but ObjectID(id) not equals id', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                var objId = ObjectID(1234)
                products.insert({_id: objId, name: 'some name'})
                util.getProductById(db, 1234, function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param).to.be.equal('No product with such id exists')
                    products.remove({_id: objId, name: 'some name'})


                    products.insert({_id: 1234, name: 'some name'})
                    util.getProductById(db, ObjectID(1234), function (status, param) {
                        expect(status).to.be.equal(200)
                        expect(param).to.be.equal('No product with such id exists')
                        products.remove({_id: 1234, name: 'some name'})
                        db.close()
                        done()
                    })
                })
            })
        })
    })
    it('should return status 200 when id exists as a string or as a number or as ObjectID', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                products.insert({_id: 1234, name: 'some name'})
                util.getProductById(db, '1234', function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param).to.eql({_id: 1234, name: 'some name'})
                    products.remove({_id: 1234, name: 'some name'})


                    products.insert({_id: '1234', name: 'some name'})
                    util.getProductById(db, 1234, function (status, param) {
                        expect(status).to.be.equal(200)
                        expect(param).to.eql({_id: '1234', name: 'some name'})
                        products.remove({_id: '1234', name: 'some name'})
                        db.close()
                        done()
                    })
                })
            })
        })
    })
    it('should return status 500 when multiple products share the same id', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                products.insert({_id: 1234, name: 'some name'})
                products.insert({_id: '1234', name: 'some name'})
                util.getProductById(db, '1234', function (status, param) {
                    expect(status).to.be.equal(500)
                    expect(param).to.be.equal('some problem occured')
                    products.remove({_id: 1234, name: 'some name'})
                    products.remove({_id: '1234', name: 'some name'})
                    done()
                })
            })
        })
    })
})

describe('getProductsByStoreId', function () {
    it('should return status 200 when no products with such store_id exist', function (done) {
        MongoClient.connect(url, function (err, db) {
            util.getProductsByStoreId(db, 'store_id that doesnt exist', function (status, param) {
                expect(status).to.be.equal(200)
                expect(param.length).to.be.equal(0)
                done()
            })
        })
    })
    it('should return status 200 when products with such store_id exist', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                products.insert({store_id: 1234})
                products.insert({store_id: 1234})
                util.getProductsByStoreId(db, 1234, function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param.length).to.be.equal(2)
                    expect(param[0].store_id).to.be.equal(1234)
                    expect(param[0].store_id).to.be.equal(1234)
                    products.remove({store_id: 1234})
                    products.remove({store_id: 1234})
                    done()
                })
            })
        })
    })
    it('should return status 200 when queried store_id is number and datbase store_id is string or other way around', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                products.insert({store_id: 1234})
                util.getProductsByStoreId(db, '1234', function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param.length).to.be.equal(1)
                    expect(param[0].store_id).to.be.equal(1234)
                    products.remove({store_id: 1234})

                    products.insert({store_id: '1234'})
                    util.getProductsByStoreId(db, 1234, function (status, param) {
                        expect(status).to.be.equal(200)
                        expect(param.length).to.be.equal(1)
                        expect(param[0].store_id).to.be.equal('1234')
                        products.remove({store_id: '1234'})
                        done()
                    })
                })
            })
        })
    })
})

describe('get10CheapestProducts', function () {
    it('should return the 10 cheapest products and ignore prices or shipping which are either not integers or parseInt(price/shipping) is not an integer', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                var pricesAndShippings = [
                    {price: 1, shipping: 0},
                    {price: 2, shipping: 0},
                    {price: '3', shipping: 0},
                    {price: 6, shipping: 0},
                    {price: 4, shipping: 0},
                    {price: '5', shipping: 0},
                    {price: '7', shipping: 0},
                    {price: '10', shipping: 0},
                    {price: '8', shipping: 0},
                    {price: 0, shipping: 0},
                    {price: '9', shipping: 0},
                    {price: undefined, shipping: 0},
                    {price: null, shipping: 0},
                    {price: -1, shipping: 0},
                    {price: Symbol(), shipping: 0}
                ]
                pricesAndShippings.forEach(function(product){
                    products.insert(product)
                })
                util.get10CheapestProducts(db, function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param.length).to.be.equal(10)
                    expect(param[0].price).to.be.equal(0)
                    expect(param[0].shipping).to.be.equal(0)
                    expect(param[1].price).to.be.equal(1)
                    expect(param[1].shipping).to.be.equal(0)
                    expect(param[2].price).to.be.equal(2)
                    expect(param[2].shipping).to.be.equal(0)
                    expect(param[3].price).to.be.equal('3')
                    expect(param[3].shipping).to.be.equal(0)
                    expect(param[4].price).to.be.equal(4)
                    expect(param[4].shipping).to.be.equal(0)
                    expect(param[5].price).to.be.equal('5')
                    expect(param[5].shipping).to.be.equal(0)
                    expect(param[6].price).to.be.equal(6)
                    expect(param[6].shipping).to.be.equal(0)
                    expect(param[7].price).to.be.equal('7')
                    expect(param[7].shipping).to.be.equal(0)
                    expect(param[8].price).to.be.equal('8')
                    expect(param[8].shipping).to.be.equal(0)
                    expect(param[9].price).to.be.equal('9')
                    expect(param[9].shipping).to.be.equal(0)

                    pricesAndShippings.forEach(function(product){
                        products.remove(product)
                    })
                    done()

                })
            })
        })
    })
    it('should return less than 10 products if no 10 products with valid prices exist', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {

                var pricesAndShippings = [
                    {price: 1, shipping: '7'},
                    {price: 2, shipping: '8'},
                    {price: '3', shipping: 9},
                    {price: 6, shipping: 0},
                    {price: 4, shipping: '3'},
                    {price: '5'},
                    {price: '7', shipping: Symbol()},
                    {price: '8', shipping: 13},
                    {price: 0, shipping: 11},
                    {price: undefined, shipping: '5'},
                    {price: null, shipping: '5'},
                    {price: -1, shipping: '5'},
                    {price: Symbol(), shipping: '5'}
                    ]
                pricesAndShippings.forEach(function(product){
                    products.insert(product)
                })
                util.get10CheapestProducts(db, function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param.length).to.be.equal(7)
                    expect(param[0].price).to.be.equal(6)
                    expect(param[0].shipping).to.be.equal(0)
                    expect(param[1].price).to.be.equal(4)
                    expect(param[1].shipping).to.be.equal('3')
                    expect(param[2].price).to.be.equal(1)
                    expect(param[2].shipping).to.be.equal('7')
                    expect(param[3].price).to.be.equal(2)
                    expect(param[3].shipping).to.be.equal('8')
                    expect(param[4].price).to.be.equal(0)
                    expect(param[4].shipping).to.be.equal(11)
                    expect(param[5].price).to.be.equal('3')
                    expect(param[5].shipping).to.be.equal(9)
                    expect(param[6].price).to.be.equal('8')
                    expect(param[6].shipping).to.be.equal(13)
                    
                    pricesAndShippings.forEach(function(product){
                        products.remove(product)
                    })
                    done()

                })
            })
        })
    })
})

describe('getProductsByTitle', function () {
    it('should return status 200 when no products with such title exist, exact or partial', function (done) {
        MongoClient.connect(url, function (err, db) {
            util.getProductsByTitle(db, 'some title that doesnt exist exact or partial', 'exact', function (status, param) {
                expect(status).to.be.equal(200)
                expect(param.length).to.be.equal(0)
                util.getProductsByTitle(db, 'some title that doesnt exist exact or partial', 'partial', function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param.length).to.be.equal(0)
                    done()
                })
            })
        })
    })
    it('should return status 400 when "partial" or "exact" are not specified correctly', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                products.insert({title: 'hello'})
                util.getProductsByTitle(db, 'hello', 'neither partial nor exact', function (status, param) {
                    expect(status).to.be.equal(400)
                    expect(param).to.be.equal('specify either "partial" or "exact", you specified "neither partial nor exact"')
                    products.remove({title: 'hello'})
                    done()
                })
            })
        })
    })

    it('should return only the products that have the exact title when user asks for exact matches', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                products.insert({title: 'hello'})
                products.insert({title: 'hello world'})
                products.insert({title: 'hello '})
                products.insert({title: 'hell'})
                products.insert({title: undefined})
                util.getProductsByTitle(db, 'hello', 'exact', function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param.length).to.be.equal(1)
                    expect(param[0].title).to.be.equal('hello')
                    products.remove({title: 'hello'})
                    products.remove({title: 'hello world'})
                    products.remove({title: 'hello '})
                    products.remove({title: 'hell'})
                    products.remove({title: undefined})
                    done()
                })
            })
        })
    })
    it('should return the products that have the part of the title when user asks for partial matches', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                products.insert({title: 'hello'})
                products.insert({title: 'hello world'})
                products.insert({title: 'hello '})
                products.insert({title: 'hell'})
                util.getProductsByTitle(db, 'hello', 'partial', function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param.length).to.be.equal(3)
                    expect(param[0].title).to.be.equal('hello')
                    expect(param[1].title).to.be.equal('hello world')
                    expect(param[2].title).to.be.equal('hello ')
                    products.remove({title: 'hello'})
                    products.remove({title: 'hello world'})
                    products.remove({title: 'hello '})
                    products.remove({title: 'hell'})
                    done()
                })
            })
        })
    })

    it('should return every product that has any title when the requested title is "" and user requested partial match', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('products', function (err, products) {
                products.insert({title: 'hello'})
                products.insert({title: 'hello world'})
                products.insert({title: 'hello '})
                products.insert({title: 'hell'})
                products.insert({title: undefined})
                util.getProductsByTitle(db, '', 'partial', function (status, param) {
                    expect(status).to.be.equal(200)
                    expect(param.length).to.be.equal(4)
                    expect(param[0].title).to.be.equal('hello')
                    expect(param[1].title).to.be.equal('hello world')
                    expect(param[2].title).to.be.equal('hello ')
                    expect(param[3].title).to.be.equal('hell')
                    products.remove({title: 'hello'})
                    products.remove({title: 'hello world'})
                    products.remove({title: 'hello '})
                    products.remove({title: 'hell'})
                    products.remove({title: undefined})
                    done()
                })
            })
        })
    })
})

describe('verifyAuthToken', function () {

    it('should return false if cookies dont have token or is not identical to auth_token', function (done) {
        MongoClient.connect(url, function (err, db) {
            util.verifyAuthCookie(db, undefined, function (authorized) {
                expect(authorized).to.be.false
                util.verifyAuthCookie(db, {}, function (authorized) {
                    expect(authorized).to.be.false
                    util.verifyAuthCookie(db, {auth_token: "some not true token"}, function (authorized) {
                        expect(authorized).to.be.false
                        done()
                    })
                })
            })
        })
    })
    it('should return true if cookies have the needed token', function (done) {
        MongoClient.connect(url, function (err, db) {
            db.collection('auth_tokens', function (err, tokens) {
                tokens.insert({auth_token: sha256('some auth token')})
                util.verifyAuthCookie(db, {auth_token: 'some auth token'}, function (authorized) {
                    expect(authorized).to.be.true
                    tokens.remove({auth_token: sha256('some auth token')})
                    done()
                })
            })
        })
    })
})

