const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = require("bluebird");     //for asyncronous thread? to control promises?

const UserSchema = new Schema({
    "email": {
      type: String,
      unique: true
    },
    "fname": String,
    "lname": String,
    "usertype":String,
    "pwd":String,
    "createdOn": {
      type: Date,
      default: Date.now
    },
    "reviews":{
      type: Number,
      default: 0
    },
    "trips":{
      type: Number,
      default: 0
    },
    "visits":{
      type: Number,
      default: 0
    }
  });

  //returns
  module.exports = mongoose.model("Users", UserSchema);