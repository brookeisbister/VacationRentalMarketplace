const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");     //for asyncronous thread? to control promises?
const Schema = mongoose.Schema;

const ListingSchema = new Schema({
    "filename": {
      type: String,
      unique: true
    },
    "type": String,
    "title": String,
    "price": Number,
    "city": String
  });

  //returns
  module.exports = mongoose.model("Listings", ListingSchema);