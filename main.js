//express web server set-up
const express = require("express");               //requiring express module
const app = express();                            //instance of executed express module
const path = require("path");
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');            //for email
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const config = require("./js/config");

//module initialization
var HTTP_PORT = process.env.PORT || 8080;       //creating variable to designate a port if port isnt designated it sets it to 8080 
const connectionString = config.dbconn;         //creating connection string
app.engine('.hbs', hbs({ extname: '.hbs' }));   // Register handlebars as the rendering engine
app.set('view engine', '.hbs');                 // Register handlebars as the rendering engine
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seneca.brookeisbister@gmail.com',
        pass: '2020web322'
    }
});

//connect to mongoDB database
let db = mongoose.createConnection(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
// log when the DB is connected
db.on('error', (err) => {
    console.log("Error - "+err);
  });
db.once("open", () => {
console.log("Database connection open");
});

//navigation
//to serve static files
app.use(express.static('./views/'));
app.use(express.static('./public/'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
    res.render('home', {
        layout: false
    });
});

app.get("/searchResults", function (req, res) {
    var Listing = [
        {
            pic: "listing1.jpg",
            type: "Single Room",
            title: "This Place is Great, I Ain't Lime",
            price: 324
        },
        {
            pic: "listing2.jpg",
            type: "Single Room",
            title: "Sweeter Dreams",
            price: -8
        },
        {
            pic: "listing3.jpg",
            type: "Entire House",
            title: "Pancakes or Eggs?",
            price: 4580
        },
        {
            pic: "listing4.jpg",
            type: "Single Room",
            title: "Are You Waking or Working?",
            price: 75
        },
        {
            pic: "listing5.jpg",
            type: "Entire House",
            title: "You Don't Have to Per-suede Me to Stay Here",
            price: 250
        },
        {
            pic: "listing6.jpg",
            type: "Single Room",
            title: "Catch Me If You Can Catch Some Z's",
            price: 90
        }
    ];
    res.render('searchResults', {
        data: Listing,
        layout: false
    });
});

app.get("/userRegistration", function (req, res) {
    res.render('userRegistration', {
        layout: false
    });
});

app.get("/login", function (req, res) {
    res.render('login', {
        layout: false
    });
});

app.get("/confirmation", function (req, res) {
    res.render('confirmation', {
        layout: false
    });
});

app.get("/details", function (req, res) {
    res.render('details', {
        layout: false
    });
});
app.get("/dashboard", function (req, res) {
    res.render('dashboard', {
        layout: false
    });
});
app.get("https:www.instagram.com", function (req, res) {
    res.redirect('https:www.instagram.com');
});
app.get("https:www.facebook.com", function (req, res) {
    res.redirect('https:www.facebook.com');
});
app.get("https:www.twitter.com", function (req, res) {
    res.redirect('https:www.twitter.com');
});

app.post("/login-for-process",
    (req, res) => {
        const loginInfo = req.body; 
        if(loginInfo.email === ""){
            return res.render("login", {errmsg: "*email is missing", user: loginInfo, layout:false}); 
        }else if(loginInfo.pwd === ""){
            return res.render("login", {errmsg: "*password is missing", user: loginInfo, layout:false}); 
        }
        else{
            res.redirect('/');
        }
    });
    
    app.post("/register-for-process",
    (req, res) => {
        const regInfo = req.body; 
        if (!regInfo.fname) {
            return res.render("userRegistration", {errmsg: "*must enter first name", user: regInfo, layout:false}); 
        }else if (!regInfo.lname) {
            return res.render("userRegistration", {errmsg: "*must enter last name", user: regInfo, layout:false}); 
        }else if (!regInfo.usertype) {
            return res.render("userRegistration", {errmsg: "*must select user type", user: regInfo, layout:false}); 
        }else if (!regInfo.email) {
            return res.render("userRegistration", {errmsg: "*must enter an email", user: regInfo, layout:false}); 
        }else if (!regInfo.pwd) {
            return res.render("userRegistration", {errmsg: "*must enter password", user: regInfo, layout:false}); 
        }else if (!/^([a-z]|[0-9]|[!@#\$%\^&\*]){8,75}$/i.test(regInfo.pwd)) {
            return res.render("userRegistration", {errmsg: "*password must be 8-75 characters", user: regInfo, layout:false}); 
        }else if (!/\d/.test(regInfo.pwd)) {
            return res.render("userRegistration", {errmsg: "*password must contain a number", user: regInfo, layout:false}); 
        }else if (!/[!@#\$%\^&\*]/.test(regInfo.pwd)) {
            return res.render("userRegistration", {errmsg: "*password must contain a symbol !@#\$%\^&\*", user: regInfo, layout:false}); 
        }else if (regInfo.pwd == regInfo.checkpwd) {
            res.redirect('/dashboard');
            var emailOptions = {
                from: 'seneca.brookeisbister@gmail.com',
                to: req.body.email,
                subject: 'Welcome to AirB&B',
                html: '<p>Hello ' + req.body.fname + ' ' + req.body.lname + ',<br/><br/>Thank you for registering with us!<br/><br/><br/>Sincerely,<br/>Customer Support</p>'
            };
            transporter.sendMail(emailOptions, (error, info) => {
                if (error) {
                    console.log("ERROR: " + error)
                } else {
                    console.log("Success: " + info.response);
                }
            })
        }else {
            return res.render("userRegistration", {errmsg: "*passwords must match", user: regInfo, layout:false});
        }                         
    });

//listening on the port
app.listen(HTTP_PORT);