const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = require("bluebird"); 
const bcrypt = require('bcryptjs');

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
    },
    "favourites": [{
      id: String,
      title: String,
      filename: String
    }]
  });

UserSchema.pre('save', async function (next){
  try{
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.pwd, salt);
    this.pwd = hash;
    next();
  }catch(err){
    next(err);
  }
});

UserSchema.methods.validatePassword = function (password){
  try{
    return bcrypt.compare(password, this.pwd);
  }
catch(err){
throw err;
}
}

  //returns
  module.exports = mongoose.model("Users", UserSchema);