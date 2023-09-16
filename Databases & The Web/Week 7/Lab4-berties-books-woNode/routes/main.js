module.exports = function (app, shopData) {

    const bcrypt = require('bcrypt');

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

    // Weather forecasting  -------

    app.get('/weather', function (req, res) {
        res.render('weather.ejs', shopData);
    });

    app.post('/weatherforcity', function (req, res) {
        
        const request = require('request'); // For interperating urls
        let apiKey = 'c678099e725abd759485b1bf1c1836cb';
        //let city = 'london';
        let city = req.body.searchbox;
        // console.log(city + ' This should be the city ');
        let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&APPID=${apiKey}`

        request(url, function (err, response, body) {
            if (err) {
                console.log('error:', error);
            } else {

                // Display the selected information or return error
                //res.send(body);
                var weather = JSON.parse(body);
                console.log(weather);
                if (weather!==undefined && weather.main!==undefined) {
                    var wmsg = '<font size="+2"> It is ' + weather.main.temp + ' degrees in <font color="Green"> <b>' + weather.name +
                    ' </b> </font> today! <br> The minimum temp is ' + weather.main.temp_min + '℃ And the maximum temp is ' + weather.main.temp_max +
                    '℃. <br> The humidity now is: ' + weather.main.humidity + '%. <br> The wind speed is: ' + weather.wind.speed +
                    'km/h <br> Sunrise is at: ' + weather.sys.sunrise +
                    ' </font> <br> <a href=' + './' + '>Home page</a>';
                    res.send(wmsg);
                }
                else{
                    res.send("No data found.  <a href=" + " ./weather" + " > Weather Forecast </a>")
                }

            }
        });

    });

    // API for books -------

    app.get('/api', function (req,res) {        //This can only be accessed through altering the URL 
        
        // Query database to get all the books
        let sqlquery1 = "SELECT * FROM books";
        let sqlquery2 = "SELECT * FROM books WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'";
        
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

    // TV shows api  --------

    app.get('/tvshows', function (req, res) {
        res.render('tvshows.ejs', shopData);
    });

    app.post('/tvshowsearch', function (req, res) {
        
        const request = require('request'); 
        //let showname = 'naruto';
        let showname = req.body.name;
        console.log(showname + ': This should be the name ');
        let url = `https://api.tvmaze.com/search/shows?q=${showname}`

        request(url, function (err, response, body) {
            if (err) {
                console.log('error:', error);
            } else {

                //res.send(body);
                var tv = JSON.parse(body);
                console.log(tv);

                // I tried to do it the way we did error handling for weather but the if statement just wouldnt
                // trigger for errors and I ended up using a try and catch block.

                // if (tv!==undefined && tv!==null) {
                //     var smsg = ' <font size="+2"> Name: <font size="+4"> <b>' + tv[0].show.name + ' </b> </font> , &emsp; Status: <b>' + tv[0].show.status +
                //     ' </b> <br> <br> Description: ' + tv[0].show.summary +
                //     ' Genres: ' + tv[0].show.genres[0] + ' <br> Average runtime per episode: ' + tv[0].show.averageRuntime +
                //     ' minutes <br> <br> Date Premiered: ' + tv[0].show.premiered + ' <br> Date ended: ' + tv[0].show.ended +
                //     ' <br> Offical Site: ' + tv[0].show.officialSite +  '<img src=' + tv[0].show.image.medium + '></img>' +
                //     '  </font> <br> <br> <a href=' + './tvshows' + '>TV Shows</a>';
                //     res.send(smsg);
                // }
                // else{
                //     res.send("No data found.  <a href=" + " ./tvshows" + " > TV Shows </a>")
                // }

                // I have also ended up using quiet a lot of inline CS and I'm not looping over all the results,
                // just displaying the most relevant one.

                try{ 
                    var smsg = '<img src=' + tv[0].show.image.medium + '></img>' + 
                    ' <br> <font size="+2"> Name: <font size="+4"> <b>' + tv[0].show.name + ' </b> </font> , &emsp; Status: <b>' + tv[0].show.status +
                    ' </b> <br> <br> Description: ' + tv[0].show.summary +
                    ' Genres: ' + tv[0].show.genres[0] + ' <br> Average runtime per episode: ' + tv[0].show.averageRuntime +
                    ' minutes <br> Language: ' + tv[0].show.language +
                    ' <br> <br> Date Premiered: ' + tv[0].show.premiered + ' <br> Date ended: ' + tv[0].show.ended +
                    ' <br> Offical Site: ' + tv[0].show.officialSite +
                    '  </font> <br> <br> <a href=' + './tvshows' + '>TV Shows</a>';
                    res.send(smsg);
                }
                catch(exception) { 
                    res.send("No data found.  <a href=" + " ./tvshows" + " > TV Shows </a>")
                }
            }
        });
    });


}

// Locked pages thorugh login > List, SearchPage, AddBook, BargainBook, ListUsers, DeleteUser
