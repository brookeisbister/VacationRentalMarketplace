//express web server set-up
var HTTP_PORT = process.env.PORT || 8080;       //creating variable to designate a port if port isnt designated it sets it to 8080 
var express = require("express");               //requiring express module
var app = express();                            //instance of executed express module
var path = require("path");

//listening on the port
app.listen(HTTP_PORT, onHttpStartup());

//to serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

//navigation
app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/searchResults", function(req, res){
    res.sendFile(path.join(__dirname, "/views/searchResults.html"));
});

app.get("/userRegistration", function(req, res){
    res.sendFile(path.join(__dirname, "/views/userRegistration.html"));
});

app.get("/login", function(req, res){
    res.sendFile(path.join(__dirname, "/views/login.html"));
});

app.get("/confirmation", function(req, res){
    res.sendFile(path.join(__dirname, "/views/confirmation.html"));
});

app.get("/details", function(req, res){
    res.sendFile(path.join(__dirname, "/views/details.html"));
});

//listing object
const listings = [
    {
        caption:'ugly ass picture',
        description:'testing text help me',
        price: 75.00,
        url: '"/static/images/info_pic.jpg"'
    }
];