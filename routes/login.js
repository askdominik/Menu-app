var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var schemas = require('../models/schemas.js');

//Login
router.get('/', (req, res) => {
  res.render('login', {title:'Login', loggedIn:false, error:null});
});

//New Account
router.get('/new-acct', (req, res) => {
  res.render('new-acct', {title:'New Account', loggedIn:false, error:null});
});

//Logging in
router.post('/', async(req, res) => {
  let email = req.body.emailInput;
  let pass = req.body.pwdInput;
  let loginSuccess = false;
  let sesh = req.session;
  sesh.loggedIn = false;

  let users = schemas.users;
  let qry = {email:email};

  if (email != '' && pass != '') {
    // Finding account using email
    let usersResult = await users.findOne(qry).then( async(data) => {
      if (data) {
        // Checking if password matches
        let passResult = await bcrypt.compare(pass, data.pwd).then( (isMatch) => {
          if (isMatch) {
            // Ok - settting sessions
            sesh.loggedIn = true;
            loginSuccess = true;
          }
        });
      }
    });
  }

  if (loginSuccess === true) {
    res.redirect('/');
  } else {
    res.render('login', {title:'Login', loggedIn:false, error:'Invalid Login!'});
  }
});

//Creating a new account
router.post('/new', async(req, res) => {
  let email = req.body.emailInput;
  let pass = req.body.pwdInput;

  if (email != '' && pass != '') {
    let users = schemas.users;
    let qry = {email:email};

    let userSearch = await users.findOne(qry).then( async(data) => {
      if (!data) {
        // password encryption
        let saltRounds = 10;
        let passSalt = await bcrypt.genSalt(saltRounds, async(err, salt) => {
          let passHash = await bcrypt.hash(pass, salt, async(err, hash) => {
            let acct = {email:email, pwd:hash, level:'admin'};
            let newUser = new schemas.users(acct);
            let saveUser = await newUser.save();
          });
        });
      }
    });

    res.render('login', {title:'Login', loggedIn:false, error:'Please login with your new account'});
  } else {
    res.render('new-acct', {title:'New Account', loggedIn:false, error:'All fields are required. Please check and try again.'});
  }
});

module.exports = router;