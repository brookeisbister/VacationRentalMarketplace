const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = require("bluebird");     //for asyncronous thread? to control promises?

const BookingSchema = new Schema({
    "guestID": String,
    "listingID": String,
    "startDate": Date,
    "endDate": Date,
    "guests": {type: Number, default: 0},
    "length": Number,
    "totalPrice": String
  });

  //returns
  module.exports = mongoose.model("Bookings", BookingSchema);