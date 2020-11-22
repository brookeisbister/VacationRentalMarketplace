//express web server set-up
const express = require("express");               //requiring express module
const app = express();                            //instance of executed express module
const path = require("path");
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');            //for email
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const clientsessions = require("client-sessions");


//connect to other documents
const config = require("./js/config");
const userModel = require("./models/userModel");
const listingModel = require("./models/listingModel");
const e = require("express");

//module initialization
var HTTP_PORT = process.env.PORT || 8080;       //creating variable to designate a port if port isnt designated it sets it to 8080 
const connectionString = config.dbconn;         //creating variableconnection string
app.use(express.static('./views/'));            //to serve static files
app.use(express.static('./public/'));           //to serve static files
app.engine('.hbs', hbs({ extname: '.hbs' }));   //Register handlebars as the rendering engine
app.set('view engine', '.hbs');                 //Register handlebars as the rendering engine
app.use(bodyParser.urlencoded({ extended: true })); //middleware for “urlencoded” form data

//email setup
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seneca.brookeisbister@gmail.com',
        pass: '2020web322'
    }
});
//configure cookie method for storing session information
app.use(clientsessions({
    cookieName: "session",
    secret: "web322_fall2020_brookeisbister_assignment",
    duration: 1000 * 60 * 5,    //duration in milisec
    activeDuration: 1000 * 60 * 5
}))

//startup function
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
};
//check login function
function checkLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login", { errmsg: "Unauthorized access, please login", layout: false });
    } else {
        next(); //exit function
    }
};
//connect to mongoDB database
mongoose.connect(connectionString, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("open", () => {
    console.log("Database connection open.");
});

// //navigation
app.get("/", function (req, res) {
    res.render('home', {
        user: req.session.user, layout: false
    });
});

app.get("/login", function (req, res) {
    res.render('login', { user: req.session.user, layout: false });
});

app.get("/logout", (req, res) => {
    //delete session variables with reset method
    req.session.reset();
    res.redirect("/");
})

app.get("/userRegistration", function (req, res) {
    res.render('userRegistration', { user: req.session.user, layout: false });
});

app.get("/dashboard", checkLogin, (req, res) => {
    res.render('dashboard', { user: req.session.user, layout: false });
});

app.get("/searchResults", function (req, res) {
    listingModel.find().lean()                 //retrieve all documents and convert mongoose document to javascript object
        .exec()                             //format to promise
        .then((listings) => {
            res.render('searchResults', { user: req.session.user, listings: listings, hasListings: !!listings.length, layout: false });
        });
});

app.get("/details", function (req, res) {
    res.render('details', { user: req.session.user, layout: false });
});

app.get("/confirmation", function (req, res) {
    res.render('confirmation', {
        user: req.session.user, layout: false
    });
});
//socials
app.get("https:www.instagram.com", function (req, res) {
    res.redirect('https:www.instagram.com');
});
app.get("https:www.facebook.com", function (req, res) {
    res.redirect('https:www.facebook.com');
});
app.get("https:www.twitter.com", function (req, res) {
    res.redirect('https:www.twitter.com');
});
//forms
app.post("/login-for-process",
    (req, res) => {
        const loginInfo = req.body;
        const loginemail = req.body.email;
        const loginpwd = req.body.pwd;
        if (loginemail === "" || loginpwd === "") {
            return res.render("login", { errmsg: "*fill in email and password", user: loginInfo, layout: false });
        }
        else {
            userModel.findOne({ email: loginemail })
                .exec()
                .then((user) => {
                    if (!user) {
                        return res.render("login", { errmsg: "*user does not exit, please register", user: loginInfo, layout: false });
                    } else {
                        if (user.pwd == loginpwd) {
                            req.session.user = {
                                email: user.email,
                                fname: user.fname,
                                lname: user.lname,
                                usertype: user.usertype,
                                createdOn: new Date(user.createdOn).toDateString(),
                                reviews: user.reviews,
                                trips: user.trips,
                                visits: user.visits
                            };
                            res.redirect("/dashboard");
                        } else {
                            return res.render("login", { errmsg: "*incorrect password", user: loginInfo, layout: false });
                        }
                    }
                })
                .catch((err) => {
                    console.log(`There was an error: ${err}`);
                });
        }
    });

app.post("/register-for-process",
    (req, res) => {
        const regInfo = req.body;
        const newUserMetadata = new userModel({
            "email": regInfo.email,
            "fname": regInfo.fname,
            "lname": regInfo.lname,
            "usertype": regInfo.usertype,
            "pwd": regInfo.pwd,
            "reviews": regInfo.reviews,
            "trips": regInfo.trips,
            "visits": regInfo.visits
        });
        if (!regInfo.fname) {
            return res.render("userRegistration", { errmsg: "*must enter first name", user: regInfo, layout: false });
        } else if (!regInfo.lname) {
            return res.render("userRegistration", { errmsg: "*must enter last name", user: regInfo, layout: false });
        } else if (!regInfo.usertype) {
            return res.render("userRegistration", { errmsg: "*must select user type", user: regInfo, layout: false });
        } else if (!regInfo.email) {
            return res.render("userRegistration", { errmsg: "*must enter an email", user: regInfo, layout: false });
        } else if (!regInfo.pwd) {
            return res.render("userRegistration", { errmsg: "*must enter password", user: regInfo, layout: false });
        } else if (!/^([a-z]|[0-9]|[!@#\$%\^&\*]){8,75}$/i.test(regInfo.pwd)) {
            return res.render("userRegistration", { errmsg: "*password must be 8-75 characters", user: regInfo, layout: false });
        } else if (!/\d/.test(regInfo.pwd)) {
            return res.render("userRegistration", { errmsg: "*password must contain a number", user: regInfo, layout: false });
        } else if (!/[!@#\$%\^&\*]/.test(regInfo.pwd)) {
            return res.render("userRegistration", { errmsg: "*password must contain a symbol !@#\$%\^&\*", user: regInfo, layout: false });
        } else if (regInfo.pwd == regInfo.checkpwd) {
            newUserMetadata.save()
                .then((user) => {
                    req.session.user = {
                        email: user.email,
                        fname: user.fname,
                        lname: user.lname,
                        usertype: user.usertype,
                        createdOn: new Date(user.createdOn).toDateString(),
                        reviews: user.reviews,
                        trips: user.trips,
                        visits: user.visits
                    };
                    res.redirect('/dashboard');
                })
                .catch((err) => {
                    if (err.code === 11000) {
                        return res.render("userRegistration", { errmsg: "*email already registered", user: regInfo, layout: false });
                    } else {
                        console.log(err);
                        return res.render("userRegistration", { errmsg: "*There was an error registering", user: regInfo, layout: false });
                    }
                })
                .then(() => {
                    var emailOptions = {
                        from: 'seneca.brookeisbister@gmail.com',
                        to: newUserMetadata.email,
                        subject: 'Welcome to AirB&B',
                        html: '<p>Hello ' + newUserMetadata.fname + ' ' + newUserMetadata.lname + ',<br/><br/>Thank you for registering with us!<br/><br/><br/>Sincerely,<br/>Customer Support</p>'
                    };
                    transporter.sendMail(emailOptions, (info, error) => {
                        console.log("Success: " + info.response);
                    })
                })
                .catch((err) => {
                    if (err) { console.log("ERROR: " + err); }
                })
        } else {
            return res.render("userRegistration", { errmsg: "*passwords must match", user: regInfo, layout: false });
        }
    });

//listening on the port
app.listen(HTTP_PORT, onHttpStart);