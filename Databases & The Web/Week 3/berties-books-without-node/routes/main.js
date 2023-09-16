module.exports = function (app, shopData) {

    // Handle our routes
    app.get('/', function (req, res) {
        res.render('index.ejs', shopData)
    });
    app.get('/about', function (req, res) {
        res.render('about.ejs', shopData);
    });
    app.get('/search', function (req, res) {
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
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
    app.get('/register', function (req, res) {
        res.render('register.ejs', shopData);
    });
    app.post('/registered', function (req, res) {

        // My work here -------------------------
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const plainPassword = req.body.pass;

        bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
            // Store hashed password in your database.

            // saving data in database
            let sqlquery = "INSERT INTO accounts (firstName, lastName, email, username, password) VALUES (?,?,?,?,?)";
            // execute sql query
            let newrecord = [req.body.first, req.body.last, req.body.email, req.body.user, hashedPassword];
            db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                else
                    result = 'Hello ' + req.body.first + ' ' + req.body.last + ' you are now registered! We will send an email to you at ' + req.body.email;
                result += 'Your password is: ' + req.body.pass + ' and your hashed password is: ' + hashedPassword;
                res.send(result);
            });

        })
        // Confirmation                                        
        //res.send(' Hello user: '+ req.body.user +' you are now registered!'); 
    });

    app.get('/listusers', function (req, res) {
        let sqlquery = "SELECT * FROM accounts"; // query database to get all the accounts
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

    app.post('/loggedin', function (req, res) {

        const bcrypt = require('bcrypt');

        // Finding the account from the database
        let sqlquery = "SELECT password from accounts WHERE username = ?;";
        // execute sql query
        db.query(sqlquery, req.body.user, (err, result) => {

            // Picking up the associated password from the querry 
            let hashedPassword = result[0].password;

            console.log("Hashed password: " + hashedPassword);
            if (err) {
                console.error(err.message);
                res.send("User doesn't exists")
            }

            // Comparing passwords to authenticate user
            else {
                bcrypt.compare(req.body.pass, hashedPassword, function (err, result) {
                    if (err) {
                        console.error(err.message);
                    }
                    else if (result) {
                        res.send("You have been logged in.");
                    }
                    else {

                        // Wrong password
                        res.send('Your password does not match.');
                    }
                });
            }
            //  res.send(' Hello user: '+ req.body.user +' your password is: '+ hashedPassword); 
        });

    });

    app.get('/deleteuser', function (req, res) {
        res.render('deleteuser.ejs', shopData);
    });

    app.post('/deleted', function (req, res) {

        //Finding the account from the database
        let sqlquery = "DELETE FROM accounts WHERE username = ?;";
        // execute sql query
        db.query(sqlquery, req.body.user, (err, result) => {

            if (err) {
                console.error(err.message);
                res.send("Account does not exists")
            }
            else
            {
                res.send(' Account for user: '+ req.body.user +' has been deleted');
            }
        });

        // Note, this will delete a user but cannot tell if a user exists or not.
        // I tried but could not succesfully get it to authenticate the account before hand. 

    });

    //-------------------------------------------

    app.get('/list', function (req, res) {
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

    app.get('/addbook', function (req, res) {
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

    app.get('/bargainbooks', function (req, res) {
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
