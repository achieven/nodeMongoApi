var sha256 = require('js-sha256').sha256

module.exports = {
    getProductById: function (db, id, callback) {
        db.collection('products', function (err, products) {
            products.find().toArray(function (err, allProducts) {
                var chosenProductArray = allProducts.filter(function (product) {
                    return product._id == id
                })
                if (chosenProductArray.length === 1) {
                    callback(200, chosenProductArray[0])
                }
                else if (chosenProductArray.length === 0) {
                    callback(200, 'No product with such id exists')
                }
                else {
                    callback(500, 'some problem occured')
                }
            })
        })
    },
    getProductsByStoreId: function (db, store_id, callback) {
        db.collection('products', function (err, products) {
            products.find().toArray(function (err, allProducts) {
                var chosenProductsArray = allProducts.filter(function (product) {
                    return product.store_id == store_id
                })
                callback(200, chosenProductsArray)
            })
        })
    },
    get10CheapestProducts: function (db, callback) {
        const nonNegativeIntegerRegex = /^\d+$/
        db.collection('products', function (err, products) {
            products.find().toArray(function (err, allProducts) {
                var productsSortedByPrice = allProducts.filter(function (product) {
                    var priceAndShippingAreNonNegativeIntegers = typeof product.price != 'symbol' && nonNegativeIntegerRegex.test(product.price)
                        && typeof product.shipping != 'symbol' && nonNegativeIntegerRegex.test(product.shipping)
                    return priceAndShippingAreNonNegativeIntegers
                }).sort(function (product1, product2) {
                    return parseInt(product1.price) + parseInt(product1.shipping) - parseInt(product2.price) - parseInt(product2.shipping)
                })
                callback(200, productsSortedByPrice.slice(0, 10))
            })
        })
    },
    getProductsByTitle: function (db, title, partialOrExact, callback) {
        if (partialOrExact != 'partial' && partialOrExact != 'exact') {
            return callback(400, 'specify either "partial" or "exact", you specified "' + partialOrExact + '"')
        }
        db.collection('products', function (err, products) {
            products.find().toArray(function (err, allProducts) {
                var productsByTitle = allProducts.filter(function (product) {
                    switch (partialOrExact) {
                        case 'exact':
                            return product.title == title
                        case 'partial':
                            return product.title && product.title.indexOf(title) > -1
                        default:
                            return false
                    }
                })
                callback(200, productsByTitle)

            })
        })
    },
    verifyAuthCookie: function(db,cookies, callback){
        db.collection('auth_tokens', function(err, tokens){
            tokens.find().toArray(function (err, auth_token) {
                if (auth_token.length === 0) {
                    callback(false)
                }
                else if(cookies && cookies.auth_token && sha256(cookies.auth_token) === auth_token[0].auth_token){
                    callback(true)
                }
                else {
                    callback(false)
                }
            })
        })
        
    }
}