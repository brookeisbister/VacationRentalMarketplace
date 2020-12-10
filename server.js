//express web server set-up
const express = require("express");
const app = express();
const path = require("path");
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const clientsessions = require("client-sessions");
const multer = require("multer");
const fs = require("fs");
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

//connect to other documents
const userModel = require("./models/userModel");
const listingModel = require("./models/listingModel");
const bookingModel = require("./models/bookingModel");
const { collection } = require("./models/userModel");
const PHOTODIRECTORY = "./public/photos/";

//module initialization
var HTTP_PORT = process.env.PORT || 8080;       //creating variable to designate a port if port isnt designated it sets it to 8080 
const uri = process.env.MONGODB_URI;
const connectionString = process.env.dbconn;    //creating variableconnection string
app.use(express.static('./views/'));            //to serve static files
app.use(express.static('./public/'));           //to serve static files
app.engine('.hbs', hbs({ extname: '.hbs' }));   //Register handlebars as the rendering engine
app.set('view engine', '.hbs');                 //Register handlebars as the rendering engine
app.use(bodyParser.urlencoded({ extended: true })); //middleware for “urlencoded” form data

//email setup
//sgMail.setApiKey(process.env.SENDGRID_API_KEY);
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

//configure cookie method for storing session information
app.use(clientsessions({
    cookieName: "session",
    secret: process.env.SECRET,
    duration: 1000 * 60 * 5,    //duration in milisec
    activeDuration: 1000 * 60 * 5
}))
// make sure the photos folder exists if not create it
if (!fs.existsSync(PHOTODIRECTORY)) {
    fs.mkdirSync(PHOTODIRECTORY);
}
//multer setup
const storage = multer.diskStorage({
    destination: PHOTODIRECTORY,
    filename: (req, file, cb) => {
        // we write the filename as the current date down to the millisecond
        // in a large web service this would possibly cause a problem if two people
        // uploaded an image at the exact same time. A better way would be to use GUID's for filenames.
        // this is a simple example.
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });  // tell multer to use the diskStorage function for naming files instead of the default.
//startup function
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
    //connect to mongoDB database
    mongoose.connect(uri || connectionString, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.connection.on("open", () => {
        console.log("Database connection open.");
    });
};
//check login function
function checkLogin(req, res, next) {
    if (!req.session.user) {
        res.render("login", { errmsg: "Unauthorized access, please login", layout: false });
    } else {
        next(); //exit function
    }
};

//GET navigation
app.get("/", function (req, res) {
    res.render('home', {
        user: req.session.user, layout: false
    });
});

app.get("/login", function (req, res) {
    req.session.reset();
    res.render('login', { user: req.session.user, layout: false });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
})

app.get("/userRegistration", function (req, res) {
    req.session.reset();
    res.render('userRegistration', { user: req.session.user, layout: false });
});

app.get("/dashboard", checkLogin, (req, res) => {
    userModel.findOne({ _id: req.session.user.userID }).lean()
        .exec()
        .then((user) => {
            if (user) {
                var admin = (user.usertype == "admin");
                if (user.favourites) {
                    var hasFavourites = !!(user.favourites.length);
                }
                user.createdOn = new Date(user.createdOn).toDateString();
                listingModel.find({ userID: user.email }).lean()
                    .exec()
                    .then((listings) => {
                        bookingModel.find({ guestID: user.email }).lean()
                            .exec()
                            .then((bookings) => {
                                res.render('dashboard', { user: user, adminStatus: admin, hasFavourites: hasFavourites, bookings: bookings, hasBookings: !!bookings.length, listings: listings, hasListings: !!listings.length, layout: false });
                            });
                    });
            } else {
                res.render('dashboard', { user: req.session.user, layout: false });
            }
        })
});

app.get("/confirmation/:_id", checkLogin, function (req, res) {
    const bookingID = req.params._id;
    bookingModel.findOne({ _id: bookingID }).lean()
        .exec()
        .then((booking) => {
            if (booking.guestID == req.session.user.email) {
                booking.startDate = new Date(booking.startDate).toDateString();
                booking.endDate = new Date(booking.endDate).toDateString()
                res.render('confirmation', {
                    user: req.session.user, booking: booking, layout: false
                });
            } else {
                res.redirect('/dashboard');
                console.log("User is not owner of booking");
            }
        });
});

app.get("/search-results", (req, res) => {
    const location = req.query.searchLocation;
    if (location == "Anywhere...") {
        listingModel.find().lean()                 //retrieve all documents and convert mongoose document to javascript object
            .exec()                             //format to promise
            .then((listings) => {
                res.render('searchResults', { user: req.session.user, listings: listings, hasListings: !!listings.length, layout: false });
            });
    } else {
        listingModel.find({ city: location }).lean()                 //retrieve all documents and convert mongoose document to javascript object
            .exec()                             //format to promise
            .then((listings) => {
                res.render('searchResults', { user: req.session.user, listings: listings, hasListings: !!listings.length, layout: false });
            });
    }
})

app.get("/details/:_id", (req, res) => {
    const listingID = req.params._id;
    listingModel.findOne({ _id: listingID }).lean()
        .exec()
        .then((listing) => {
            userModel.findOne({ email: listing.userID }).lean()
                .exec()
                .then((owner) => {
                    return res.render('details', { user: req.session.user, listing: listing, owner: owner, layout: false });
                })
        });
})

app.get("/edit-details/:filename", checkLogin, (req, res) => {
    const filename = req.params.filename;
    listingModel.findOne({ filename: filename }).lean()
        .exec()
        .then((listing) => {
            userModel.findOne({ email: listing.userID }).lean()
                .exec()
                .then((owner) => {
                    if (owner._id == req.session.user.userID) {
                        return res.render('edit-details', { user: req.session.user, listing: listing, owner: owner, layout: false });
                    }
                    else {
                        res.redirect('/dashboard');
                        console.log("User is not owner of this listing");
                    }
                })
        });
})

//socials
app.get("/instagram", function (req, res) {
    res.redirect('https://www.instagram.com/');
});
app.get("/facebook", function (req, res) {
    res.redirect('https://www.facebook.com');
});
app.get("/twitter", function (req, res) {
    res.redirect('https://www.twitter.com');
});
//POST navigation
app.post("/login-for-process",
    (req, res) => {
        const loginInfo = req.body;
        const loginemail = req.body.email;
        const loginpwd = req.body.pwd;
        if (loginemail === "" || loginpwd === "") {
            return res.render("login", { errmsg: "*fill in email and password", inputUser: loginInfo, layout: false });
        }
        else {
            userModel.findOne({ email: loginemail })
                .exec()
                .then((user) => {
                    if (!user) {
                        return res.render("login", { errmsg: "*user does not exit, please register", inputUser: loginInfo, layout: false });
                    } else {
                        //user validate function here
                        user.validatePassword(loginpwd)
                            .then((match) => {
                                if (match) {
                                    req.session.user = {
                                        userID: user._id,
                                        email: user.email
                                    };
                                    res.redirect("/dashboard");
                                } else {
                                    return res.render("login", { errmsg: "*incorrect password", inputUser: loginInfo, layout: false });
                                }
                            })
                    }
                })
                .catch((err) => {
                    res.redirect('/');
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
            return res.render("userRegistration", { errmsg: "*must enter first name", inputUser: regInfo, layout: false });
        } else if (!regInfo.lname) {
            return res.render("userRegistration", { errmsg: "*must enter last name", inputUser: regInfo, layout: false });
        } else if (!regInfo.usertype) {
            return res.render("userRegistration", { errmsg: "*must select user type", inputUser: regInfo, layout: false });
        } else if (!regInfo.email) {
            return res.render("userRegistration", { errmsg: "*must enter an email", inputUser: regInfo, layout: false });
        } else if (!regInfo.pwd) {
            return res.render("userRegistration", { errmsg: "*must enter password", inputUser: regInfo, layout: false });
        } else if (!/^([a-z]|[0-9]|[!@#\$%\^&\*]){8,75}$/i.test(regInfo.pwd)) {
            return res.render("userRegistration", { errmsg: "*password must be 8-75 characters", inputUser: regInfo, layout: false });
        } else if (!/\d/.test(regInfo.pwd)) {
            return res.render("userRegistration", { errmsg: "*password must contain a number", inputUser: regInfo, layout: false });
        } else if (!/[!@#\$%\^&\*]/.test(regInfo.pwd)) {
            return res.render("userRegistration", { errmsg: "*password must contain a symbol !@#\$%\^&\*", inputUser: regInfo, layout: false });
        } else if (regInfo.pwd == regInfo.checkpwd) {
            newUserMetadata.save()
                .then((user) => {
                    if (user) {
                        req.session.user = {
                            userID: user._id,
                            email: user.email
                        };
                        res.redirect('/dashboard');
                        var emailOptions = {
                            from: process.env.MAIL_USER,
                            to: newUserMetadata.email,
                            subject: 'Welcome to AirB&B',
                            html: '<p>Hello ' + newUserMetadata.fname + ' ' + newUserMetadata.lname + ',<br/><br/>Thank you for registering with us!<br/><br/><br/>Sincerely,<br/>Customer Support</p>'
                        };
                        transporter.sendMail(emailOptions, (error, info) => {
                            if (error) {
                                console.log("ERROR: " + error);
                            } else {
                                console.log("Success: " + info.response);
                            }
                        });
                    }
                    else {
                        console.log("user was not returned from save");
                        res.redirect('/');
                    }
                })
                .catch((err) => {
                    if (err.code === 11000) {
                        return res.render("userRegistration", { errmsg: "*email already registered", inputUser: regInfo, layout: false });
                    } else {
                        console.log("Error: " + err);
                        return res.render("userRegistration", { errmsg: "*There was an error registering", inputUser: regInfo, layout: false });
                    }
                });
        } else {
            return res.render("userRegistration", { errmsg: "*passwords must match", inputUser: regInfo, layout: false });
        }
    });

app.post("/add-listing", upload.single("photo"), checkLogin, (req, res) => {
    const listingMetadata = new listingModel({
        userID: req.session.user.email,
        type: req.body.type,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        city: req.body.city,
        filename: req.file.filename
    });

    listingMetadata.save()
        .then(() => {
            res.redirect("/dashboard");
        })
        .catch((err) => {
            if (err.code === 11000) {
                console.log("Error: " + err);
                res.redirect("/dashboard");
            } else {
                console.log("Error: " + err);
                res.redirect("/dashboard");
            }
        });
});

app.post("/remove-listing/:filename", checkLogin, (req, res) => {
    const filename = req.params.filename;   // req.params holds the dynamic parameters of a url
    // remove the photo
    listingModel.remove({ filename: filename })
        .then(() => {
            // now remove the file from the file system.
            fs.unlink(PHOTODIRECTORY + filename, (err) => {
                if (err) {
                    return console.log("Error: " + err);
                }
                console.log("Removed file : " + filename);
            });
            // redirect to home page once the removal is done.
            res.redirect("/dashboard");
        }).catch((err) => {
            console.log("Error: " + err);
            res.redirect("/dashboard");
        });
});

app.post("/edit-listing/:filename", upload.single("photo"), checkLogin, (req, res) => {
    const filename = req.params.filename;
    const updated = req.body;
    if (req.file) {
        fs.unlink(PHOTODIRECTORY + filename, (err) => {
            if (err) {
                return console.log("Error: " + err);
            }
            console.log("Removed file : " + filename);
        });
        listingModel.updateOne(
            { filename: filename },
            {
                $set: {
                    filename: req.file.filename,
                    title: updated.title,
                    description: updated.description,
                    price: updated.price,
                    city: updated.city
                }
            }
        ).exec()
            .then(() => {
                res.redirect("/dashboard");
            }).catch((err) => {
                console.log("Error: " + err);
                res.redirect("/dashboard");
            });
    }
    else {
        listingModel.updateOne(
            { filename: filename },
            {
                $set: {
                    type: updated.type,
                    title: updated.title,
                    description: updated.description,
                    price: updated.price,
                    city: updated.city
                }
            }
        ).exec()
            .then(() => {
                res.redirect("/dashboard");
            }).catch((err) => {
                console.log("Error: " + err);
                res.redirect("/dashboard");
            });
    }
});

app.post("/create-booking", checkLogin, (req, res) => {
    const bookingInfo = req.body;
    userModel.findOne({ _id: req.session.user.userID }).lean()
        .exec()
        .then((guest) => {
            if (bookingInfo.bookingStart && bookingInfo.bookingEnd) {
                const newBookingMetadata = new bookingModel({
                    "guestID": guest.email,
                    "listingID": bookingInfo.listingID,
                    "startDate": bookingInfo.bookingStart,
                    "endDate": bookingInfo.bookingEnd,
                    "length": bookingInfo.stayLength,
                    "totalPrice": bookingInfo.cost
                });
                newBookingMetadata.save()
                    .then((booking) => {
                        //go to confirmation page
                        res.redirect('/confirmation/' + booking._id);
                        //send confirmation email
                        const emailOptions = {
                            from: process.env.MAIL_USER,
                            to: newBookingMetadata.guestID,
                            subject: 'AirB&B Booking Confirmation',
                            html: `<p>Hello ${guest.fname} ${guest.lname},</p><p>Your reservation is confirmed. Thank you!</p><p><strong>Booking Details</strong></p><p style="padding-left: 40px;"><strong>Confirmation Code:</strong> ${booking._id}</p><p style="text-align: left; padding-left: 40px;"><strong>Check-in:</strong> ${booking.startDate}</p><p style="text-align: left; padding-left: 40px;"><strong>Check-out:</strong> ${booking.endDate}</p><p style="padding-left: 40px;"><strong>Total:</strong> ${booking.totalPrice}</p><p>&nbsp;</p><p>Enjoy your stay,</p><p>Customer Support</p>`
                        };
                        // sgMail
                        //     .send(emailOptions)
                        //     .then(() => {
                        //         console.log('Email sent')
                        //     })
                        //     .catch((error) => {
                        //         console.error(error)
                        //     });
                        transporter.sendMail(emailOptions, (error, info) => {
                            if (error) {
                                console.log("ERROR: " + error);
                            } else {
                                console.log("Success: " + info.response);
                            }
                        });
                        //update guest trip stat
                        userModel.updateOne(
                            { email: newBookingMetadata.guestID },
                            { $inc: { trips: 1 } }
                        ).exec().then((result, err) => {
                            if (err) { console.log("Error: " + err); }
                        });
                        //update owner visit stat
                        userModel.updateOne(
                            { _id: bookingInfo.ownerID },
                            { $inc: { visits: 1 } }
                        ).exec().then((result, err) => {
                            if (err) { console.log("Error: " + err); }
                        });

                    })
                    .catch((err) => {
                        console.log("Error: " + err);
                        res.redirect('/details/' + bookingInfo.listingID);
                    });
            } else {
                res.redirect('/details/' + bookingInfo.listingID);
            }
        })

})

app.post("/add-to-favourites", checkLogin, (req, res) => {
    userModel.updateOne({ _id: req.session.user.userID },
        {
            $push: { favourites: { id: req.body.listingID, title: req.body.title, filename: req.body.filename } }
        }
    )
        .exec()
        .then(() => {
            res.redirect("/dashboard");
        }).catch((err) => {
            res.redirect("/dashboard");
            console.log("Error: " + err);
        });
});

app.post("/remove-favourite/:id", checkLogin, (req, res) => {
    const favouriteID = req.params.id;
    userModel.updateOne({ _id: req.session.user.userID },
        {
            $pull: { favourites: { _id: favouriteID } }
        }
    )
        .exec()
        .then(() => {
            res.redirect("/dashboard");
        }).catch((err) => {
            res.redirect("/dashboard");
            console.log("Error: " + err);
        });
});
//listening on the port
app.listen(HTTP_PORT, onHttpStart);