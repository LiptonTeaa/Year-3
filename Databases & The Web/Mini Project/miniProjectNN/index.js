// Import the modules we need
var express = require ('express')
var ejs = require('ejs')
var bodyParser= require ('body-parser')
const mysql = require('mysql');

// Lab 3 ......
var session = require ('express-session');
var validator = require ('express-validator');

// Making sanitizer a global variable 
const expressSanitizer = require('express-sanitizer');

// Create the express application object
const app = express()
const port = 8000
app.use(bodyParser.urlencoded({ extended: true }))

// Set up css
app.use(express.static(__dirname + '/public'));

// Create an input sanitizer ...
app.use(expressSanitizer());

// Create a session............
app.use(session({
    secret: 'somerandomstuff',
     resave: false,
      saveUninitialized: false,
       cookie: {
            expires: 600000
        }
}));

// Define the database connection
const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: 'ILoveBread',
    database: 'recipeBuddy'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database, press ^C to terminate.');
});
global.db = db;

// Set the directory where Express will pick up HTML files
// __dirname will get the current directory
app.set('views', __dirname + '/views');

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

// Tells Express how we should process html files
// We want to use EJS's rendering engine
app.engine('html', ejs.renderFile);

// Define our data
var siteData = {siteName: "Recipe Buddy"}

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./routes/main")(app, siteData);

// Start the web app listening
app.listen(port, () => console.log(`Example app listening on port ${port}!`))