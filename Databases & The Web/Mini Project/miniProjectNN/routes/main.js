module.exports = function (app, siteData) {

    const bcrypt = require('bcrypt');

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) { res.redirect('./login'); }
        else { next(); }
    }
    const { check, validationResult } = require('express-validator');

    // Handle our routes
    app.get('/', function (req, res) {
        res.render('index.ejs', siteData)
    });
    app.get('/about', function (req, res) {
        res.render('about.ejs', siteData);
    });
    app.get('/search', redirectLogin, function (req, res) {
        res.render("search.ejs", siteData);
    });
    app.get('/search-result', [check('keyword').exists().isAlpha()], function (req, res) {

        //Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./search');
        }
        else {

            //searching in the database
            let sqlquery = "SELECT * FROM food WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all the similar food
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }else if(result.length <= 0 ){ 
                    // This should catch a non existent food
                    res.send('Food does not exist in database. <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './search' + '>Search</a>');
                }else{
                //console.log(result.length);
                let newData = Object.assign({}, siteData, { availableFood: result });
                console.log(newData)
                res.render("list.ejs", newData)
                }
            });
        }
    });

    app.get('/register', function (req, res) {
        res.render('register.ejs', siteData);
    });

    app.post('/registered', [
        check('email').isEmail(),
        check('pass').isLength({ min: 8 }).matches('[0-9]').matches('[A-Z]').matches('[a-z]'),
        check('first').isAlpha(),
        check('last').isAlpha(),
        check('user').isAlphanumeric()], function (req, res) {

            // I tried to have these messages pop up in sanitisation but it just wouldn't work.
            // .withMessage('Password Must Be at Least 8 Characters')
            // .matches('[0-9]').withMessage('Password Must Contain a Number')
            // .matches('[A-Z]').withMessage('Password Must Contain an Uppercase Letter'),
            // It will just refresh the page if the criteria isn't met 

            // Validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./register');
            }
            else {

                // const bcrypt = require('bcrypt');
                const saltRounds = 10;
                const plainPassword = req.sanitize(req.body.pass); // Sanitising password input before passing

                bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
                    // Store hashed password in your database.

                    // saving data in database
                    let sqlquery = "INSERT INTO accounts (firstName, lastName, email, username, password) VALUES (?,?,?,?,?)";
                    // execute sql query
                    let newrecord = [req.sanitize(req.body.first),
                    req.sanitize(req.body.last),
                    req.sanitize(req.body.email),
                    req.sanitize(req.body.user),
                        hashedPassword];

                    db.query(sqlquery, newrecord, (err, result) => {
                        if (err) {
                            return console.error(err.message);
                        }
                        else {
                            result = 'Hello ' + req.body.first + ' ' + req.body.last + ', you are now registered! We will send an email to you at ' + req.body.email;
                            result += '. Your password is: ' + req.body.pass + ' and your hashed password is: ' + hashedPassword;
                            result += '<br> <br> <link rel="stylesheet" type="text/css" href="main.css"/> <a href= ' + ' ./ ' + ' >Home page</a> ';
                            res.send(result);
                        }
                    });

                })
            }
        });

    app.get('/listusers', redirectLogin, function (req, res) {

        // query database to get all the accounts
        let sqlquery = "SELECT * FROM accounts";
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, siteData, { users: result });
            console.log(newData)
            res.render("listusers.ejs", newData)
        });
    });

    app.get('/login', function (req, res) {
        res.render('login.ejs', siteData);
    });

    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            // Informs of a successful log out and provides a link to return to the home page.
            res.send('You are now logged out.  <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './' + '>Home</a>');
        });
    });


    app.post('/loggedin', [
        check('user').isAlphanumeric(),
        check('pass').isLength({ min: 8 }).matches('[0-9]').matches('[A-Z]').matches('[a-z]')
    ], function (req, res) {

        // Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./login');
        }
        else {

            let username = req.sanitize(req.body.user); // Sanitizing username input 
            // Finding the account from the database
            let sqlquery = "SELECT password from accounts WHERE username = ?;";
            // execute sql query
            db.query(sqlquery, username, (err, result) => {

                if (err) {
                    console.error(err.message);
                    res.redirect('./')
                }
                
                else if(result.length <= 0 ){ 
                    // This should catch a non existent user
                    res.send('User does not exist in database. <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './login' + '>Login</a>');
                }

                // Comparing passwords to authenticate user
                else {

                    // Picking up the associated password from the querry 
                    let hashedPassword = result[0].password;
                    console.log("Hashed password: " + hashedPassword);

                    bcrypt.compare(req.sanitize(req.body.pass), hashedPassword, function (err, result) {
                        if (err) {
                            console.error(err.message);
                        }
                        else if (result) {
                            // Save user session here, when login is successful
                            req.session.userId = username;
                            // res.send("You have been logged in.");
                            res.send('You are now logged in. ' + ' <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './' + '>Home page</a>');
                        }
                        else {
                            // Wrong password
                            //res.send('Your password does not match.');
                            res.send('Your password does not match. <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './login' + '>Login page</a>');
                        }
                    });
                }
            });
        }
    });

    app.get('/deleteuser', redirectLogin, function (req, res) {
        res.render('deleteuser.ejs', siteData);
    });

    app.post('/deleted', [check('user').isAlphanumeric()], function (req, res) {

        // Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./deleteuser');
        }
        else {

            // -------------- Finding user first

            //searching in the database
            let sqlquery0 = "SELECT * FROM accounts WHERE username = ?;" // query database to get all similar food
            // execute sql query
            db.query(sqlquery0, req.sanitize(req.body.user), (err, result) => {
                if (err) {
                    console.log("We have hit an error" );
                    res.redirect('./');
                }else if(result.length <= 0 ){ 
                    // This should catch a non existent User
                    res.send('User does not exist in database. <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './deleteuser' + '>Account Delete</a>');
                }else{

                    // -------------- Delete below

                    // Finding the account from the database
                    let sqlquery = "DELETE FROM accounts WHERE username = ?;";
                    // execute sql query
                    db.query(sqlquery, req.sanitize(req.body.user), (err, result) => {

                        if (err) {
                            console.error(err.message);
                            res.redirect('./');
                        }else {
                            res.send(' Account for user: <b>' + req.body.user + '</b> has been deleted. <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './' + '>Home page</a>');
                        }
                    });

                }
            });
        }
    });

    // List all stored food in database ----------------------- 

    app.get('/list', function (req, res) {
        let sqlquery = "SELECT * FROM food"; // query database to get all food
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, siteData, { availableFood: result });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });

    // API  -----------

    app.get('/api', function (req,res) {        //This can only be accessed through altering the URL 
        
        // Query database to get all food or select food
        let sqlquery1 = "SELECT * FROM food";
        // http://localhost:8000/api , https://www.doc.gold.ac.uk/usr/307/api (To run^)
        let sqlquery2 = "SELECT * FROM food WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'";
        // http://localhost:8000/api?keyword=cupcake , https://www.doc.gold.ac.uk/usr/307/api?keyword=cupcake (To run^)
        
        if (req.query.keyword == undefined)
        {
            // Execute the sql query
            db.query(sqlquery1, (err, result) => { if (err) {
                res.redirect('./');
            }   
            // Return results as a JSON object
            res.json(result);
        });
        }else{
            db.query(sqlquery2, (err, result) => { if (err) {
                    res.redirect('./');
                }   
                // Return results as a JSON object
                res.json(result);
            });
        }

    });

    // Recipe Buddy food records -------------

    app.get('/food', redirectLogin, function (req, res) {
        res.render('food.ejs', siteData)
    });

    app.post('/food-store', [ 
        check('name').isAlpha(),
        check('value').isLength({ min: 1 }).matches('[0-9]'),
        check('unit').isAlpha(),
        check('carbs').exists().isFloat(),
        check('fat').exists().isFloat(),
        check('protein').exists().isFloat(),
        check('salt').exists().isFloat(),
        check('sugar').exists().isFloat()], 
        function (req, res) {

            // I tried to get these to run as pop up messages in sanitisation but it just wouldn't work.
            // The page just refreshes if input criteria isn't met.

            // Validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./food');
            }
            else {

                // saving data in database
                let sqlquery = "INSERT INTO food (name, value, unit, carbs, fat, protein, salt, sugar) VALUES (?,?,?,?,?,?,?,?)";
                // execute sql query
                let newrecord = [req.sanitize(req.body.name),
                req.sanitize(req.body.value),
                req.sanitize(req.body.unit),
                req.sanitize(req.body.carbs),
                req.sanitize(req.body.fat),
                req.sanitize(req.body.protein),
                req.sanitize(req.body.salt),
                req.sanitize(req.body.sugar)];

                db.query(sqlquery, newrecord, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    else {
                        result = 'The following entry has been made to the database: ';
                        result += '<br> ' + req.body.value + ' ' + req.body.unit + ' of ' + req.body.name + ' has ';
                        result += req.body.carbs + req.body.unit + ' of carbs, ';
                        result += req.body.fat + req.body.unit + ' of fat, ';
                        result += req.body.protein + req.body.unit + ' of protein, ';
                        result += req.body.salt + req.body.unit + ' of salt and ';
                        result += req.body.sugar + req.body.unit + ' of sugar. ';
                        result += '<br> <br> <link rel="stylesheet" type="text/css" href="main.css"/> <a href= ' + ' ./ ' + ' >Home page</a> ';
                        res.send(result);
                        // (message format) A 100 grams of flour has 81g carbs, 1.4g fats, etc.
                    }
                });

            }
        }
    );

    app.get('/update', redirectLogin, function (req, res) {
        res.render('update.ejs', siteData);
    });

    app.get('/update-result', [check('keyword').exists().isAlpha()], function (req, res) {

        //Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./update');
        }
        else {

            //searching in the database
            let sqlquery = "SELECT * FROM food WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all similar food
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }else if(result.length <= 0 ){ 
                    // This should catch a non existent food
                    res.send('Food does not exist in database. <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './update' + '>Update Food</a>');
                }else{
                console.log(result.length);
                let newData = Object.assign({}, siteData, { availableFood: result });
                console.log(newData)
                res.render("alter.ejs", newData)
                }
            });
        }
    });

    app.post('/alter-fin', [ 
        check('name').isAlpha(),
        check('value').isLength({ min: 1 }).matches('[0-9]'),
        check('unit').isAlpha(),
        check('carbs').exists().isFloat(),
        check('fat').exists().isFloat(),
        check('protein').exists().isFloat(),
        check('salt').exists().isFloat(),
        check('sugar').exists().isFloat()], 
        function (req, res) {

            // Validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.redirect('./update');
            }
            else {

                // saving updated data for record in database
                let sqlquery = " UPDATE food SET value = ? ,unit = ?, carbs = ?, fat = ?, protein = ?, salt = ?, sugar = ? WHERE name = ? "
                // execute sql query
                let newrecord = [req.sanitize(req.body.value),
                req.sanitize(req.body.unit),
                req.sanitize(req.body.carbs),
                req.sanitize(req.body.fat),
                req.sanitize(req.body.protein),
                req.sanitize(req.body.salt),
                req.sanitize(req.body.sugar),
                req.sanitize(req.body.name)];

                db.query(sqlquery, newrecord, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    else {
                        result = 'The following changes have been made to the record: ';
                        result += '<br>' + req.body.value + ' ' + req.body.unit + ' of ' + req.body.name + ' has ';
                        result += req.body.carbs + req.body.unit + ' of carbs, ';
                        result += req.body.fat + req.body.unit + ' of fat, ';
                        result += req.body.protein + req.body.unit + ' of protein, ';
                        result += req.body.salt + req.body.unit + ' of salt and ';
                        result += req.body.sugar + req.body.unit + ' of sugar now. ';
                        result += '<br><br> <link rel="stylesheet" type="text/css" href="main.css"/> <a href= ' + ' ./ ' + ' >Home page</a> ';
                        res.send(result);
                        // While it works, the caveat is that while name may presnt itself as an input box, in reality
                        // it can't be changed this way and altering it will prevent other values from changing. If you wish
                        // to change the name, please delete the record and make a new one. Having the name as in input is 
                        // necessary for the sql to run as records are identified using the name.
                    }
                });

            }
        }
    );

    app.post('/delete-food', [check('name').isAlphanumeric()], function (req, res) {

        //Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./update');
        }
        else {

            //Finding the record in the database to delete
            let sqlquery = "DELETE FROM food WHERE name = ?;";
            // execute sql query
            db.query(sqlquery, req.sanitize(req.body.name), (err, result) => {

                if (err) {
                    console.error(err.message);
                    res.redirect('./');
                }
                else {
                    res.send(' Record for food: <b>' + req.body.name + '</b> has been deleted. <link rel="stylesheet" type="text/css" href="main.css"/> <a href=' + './' + '>Home page</a>');
                }
            });
        }
    });

}

// Note,

// Locked pages thorugh login > List, SearchPage, AddBook, BargainBook, ListUsers, DeleteUser, AddFood, UpdateFood

// For whatever reason, the validation won't accept a name with any sapces as an input. Everything else worsa as intended,
// even search will find like records to display.
