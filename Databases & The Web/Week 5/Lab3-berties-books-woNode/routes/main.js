module.exports = function (app, shopData) {

    const bcrypt = require('bcrypt');
    // Lab 3......
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) { res.redirect('./login'); }
        else { next(); }
    }
    const { check, validationResult } = require('express-validator');

    // Handle our routes
    app.get('/', function (req, res) {
        res.render('index.ejs', shopData)
    });
    app.get('/about', function (req, res) {
        res.render('about.ejs', shopData);
    });
    app.get('/search', redirectLogin, function (req, res) {
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', [check('keyword').isAlpha()], function (req, res) {

        //Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./search');
        }
        else {

            //searching in the database
            let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }
                let newData = Object.assign({}, shopData, { availableBooks: result });
                console.log(newData)
                res.render("list.ejs", newData)
            });
        }
    });

    app.get('/register', function (req, res) {
        res.render('register.ejs', shopData);
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
                    let newrecord = [ req.sanitize(req.body.first),
                         req.sanitize(req.body.last),
                          req.sanitize(req.body.email),
                           req.sanitize(req.body.user),
                            hashedPassword];

                    db.query(sqlquery, newrecord, (err, result) => {
                        if (err) {
                            return console.error(err.message);
                        }
                        else {
                            result = 'Hello ' + req.body.first + ' ' + req.body.last + ' you are now registered! We will send an email to you at ' + req.body.email;
                            result += 'Your password is: ' + req.body.pass + ' and your hashed password is: ' + hashedPassword + ' <a href= ' + ' ./ ' + ' >Home page</a> ';
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
            let newData = Object.assign({}, shopData, { users: result });
            console.log(newData)
            res.render("listusers.ejs", newData)
        });
    });

    app.get('/login', function (req, res) {
        res.render('login.ejs', shopData);
    });

    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            // Informs of a successful log out and provides a link to return to the home page.
            res.send('you are now logged out. <a href=' + './' + '>Home</a>');
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

                // Picking up the associated password from the querry 
                let hashedPassword = result[0].password;

                console.log("Hashed password: " + hashedPassword);
                if (err) {
                    console.error(err.message);
                    res.send("User doesn't exists")
                }

                // Comparing passwords to authenticate user
                else {
                    bcrypt.compare(req.sanitize(req.body.pass), hashedPassword, function (err, result) {
                        if (err) {
                            console.error(err.message);
                        }
                        else if (result) {
                            // Save user session here, when login is successful
                            req.session.userId = username;
                            // res.send("You have been logged in.");
                            res.send('You are now logged in. ' + '<a href=' + './' + '>Home page</a>');
                        }
                        else {
                            // Wrong password
                            //res.send('Your password does not match.');
                            res.send('Your password does not match.  <a href=' + './login' + '>Login page</a>');
                        }
                    });
                }
            });
        }
    });

    app.get('/deleteuser', redirectLogin, function (req, res) {
        res.render('deleteuser.ejs', shopData);
    });

    app.post('/deleted', [check('user').isAlphanumeric()], function (req, res) {

        //Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./deleteuser');
        }
        else {

            //Finding the account from the database
            let sqlquery = "DELETE FROM accounts WHERE username = ?;";
            // execute sql query
            db.query(sqlquery, req.sanitize(req.body.user), (err, result) => {

                if (err) {
                    console.error(err.message);
                    res.send("Account does not exists")
                }
                else {
                    res.send(' Account for user: ' + req.body.user + ' has been deleted.  <a href=' + './' + '>Home page</a>');
                }
            });

            // Note, this will delete a user but cannot tell if a user exists or not.
            // I tried but could not succesfully get it to authenticate the account before hand. 

        }
    });

    //------------------------------------------- 

    app.get('/list', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });

    app.get('/addbook', redirectLogin, function (req, res) {
        res.render('addbook.ejs', shopData);
    });

    app.post('/bookadded', function (req, res) {
        // saving data in database
        let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
        // execute sql query
        let newrecord = [req.body.name, req.body.price];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            else
                res.send(' This book is added to database, name: ' + req.body.name + ' price ' + req.body.price);
        });
    });

    app.get('/bargainbooks', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("bargains.ejs", newData)
        });
    });

}


// Locking pages thorugh login > List, SearchPage, AddBook, BargainBook, ListUsers, DeleteUser
