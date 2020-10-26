//express web server set-up
const express = require("express");               //requiring express module
const app = express();                            //instance of executed express module
const path = require("path");
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');            //for email

//module initialization
var HTTP_PORT = process.env.PORT || 8080;       //creating variable to designate a port if port isnt designated it sets it to 8080 
app.engine('.hbs', hbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seneca.brookeisbister@gmail.com',
        pass: '2020web322'
    }
});

//navigation
//to serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));
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
            price: 75
        },
        {
            pic: "listing2.jpg",
            type: "Single Room",
            title: "Sweeter Dreams",
            price: 75
        },
        {
            pic: "listing3.jpg",
            type: "Entire House",
            title: "Pancakes or Eggs?",
            price: 75
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
        if (req.body.email) {
            if (req.body.pwd) {
                res.redirect('/');
            }
            else {
                var pwdEmpty = { pwd: "must enter a password" };
                res.render('login', {
                    data: pwdEmpty,
                    layout: false
                })
            }
        }
        else {
            var emailEmpty = { email: "must enter an email" };
            res.render('login', {
                data: emailEmpty,
                layout: false
            })
        }
    });

app.post("/register-for-process",
    (req, res) => {
        if (req.body.fname) {
            if (req.body.lname) {
                if (req.body.usertype) {
                    if (req.body.email) {
                        if (/^([a-z]|[0-9]|[!@#\$%\^&\*]){8,75}$/i.test(req.body.pwd)) {
                            if (/\d/.test(req.body.pwd)) {
                                if (/[!@#\$%\^&\*]/.test(req.body.pwd)) {
                                    if (req.body.pwd == req.body.checkpwd) {
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
                                    } else {
                                        var pwdCheck = { checkpwd: "passwords must match" };
                                        res.render('userRegistration', {
                                            data: pwdCheck,
                                            layout: false
                                        })
                                    }
                                } else {
                                    var pwdNoSym = { pwd: "must contain a symbol !@#\$%\^&\*" };
                                    res.render('userRegistration', {
                                        data: pwdNoSym,
                                        layout: false
                                    })
                                }
                            } else {
                                var pwdNoNum = { pwd: "must contain a number" };
                                res.render('userRegistration', {
                                    data: pwdNoNum,
                                    layout: false
                                })
                            }
                        } else {
                            var pwdLength = { pwd: "must be 8-75 characters" };
                            res.render('userRegistration', {
                                data: pwdLength,
                                layout: false
                            })
                        }
                    } else {
                        var emailEmpty = { email: "must enter an email" };
                        res.render('userRegistration', {
                            data: emailEmpty,
                            layout: false
                        })
                    }
                } else {
                    var usertypeEmpty = { usertype: "must pick one" };
                    res.render('userRegistration', {
                        data: usertypeEmpty,
                        layout: false
                    })
                }
            } else {
                var lnameEmpty = { lname: "must enter last name" };
                res.render('userRegistration', {
                    data: lnameEmpty,
                    layout: false
                })
            }
        } else {
            var fnameEmpty = { fname: "must enter first name" };
            res.render('userRegistration', {
                data: fnameEmpty,
                layout: false
            })
        }
    });

//listening on the port
app.listen(HTTP_PORT);