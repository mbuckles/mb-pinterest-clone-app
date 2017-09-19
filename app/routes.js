const User = require('./models/user');
const Pin = require('./models/pin');
const AllPin = require('./models/allpin');
const LinkPin = require('./models/linkpin');
var searchTerm = require('./models/searchTerm');
const mongoose = require('mongoose');
var configDB = require('../config/database.js');
const assert = require('assert');
var Bing = require('node-bing-api')({accKey: '855d213f01044028bb78e77adf289f25'});
var requestify = require('requestify');

module.exports = function(app, passport){
// render the main index page
app.get('/', function(req, res) {
  AllPin.find({})
    .exec(function(err, allpins){
    if (err){
      res.send('error has occured!');
    }else {
      res.render('pages/index', {allpins: allpins})
    }
    })
});

//Local login routes
app.get('/login', function(req, res){
  		res.render('pages/login.ejs', { message: req.flash('loginMessage') });
  	  });
app.post('/login', passport.authenticate('local-login', {
  		successRedirect: '/myPins',
  		failureRedirect: '/login',
  		failureFlash: true
  	  }));
//logout
app.get('/logout', function(req, res){
      		req.logout();
      		res.redirect('/');
      	});
// show the signup form
app.get('/signup', function(req, res) {
         res.render('pages/signup.ejs', { message: 'Get signed up!' });
     });
app.post('/signup',  passport.authenticate('local-signup', {
      successRedirect: '/myPins',
      failureRedirect: '/signup',
      failureFlash: true
    }),function(req, res){
      console.log(req.body.city);
      console.log(req.body.state);
    });
//Update get local only
app.get('/user', isLoggedIn, function(req, res){
      var user = req.user;
      res.render('pages/user.ejs', { message: 'Update location!' , user: req.user });
    });

//Update local user post
    app.post('/user', isLoggedIn, function(req, res){
      var user = req.body;
      var id = req.user._id;
      console.log(id);
      User.findOne({_id: id}, function(err, user){
        var newUser = user;
        console.log(user);
        user.local.username = req.body.email;
        user.local.city = req.body.city;
        user.state = req.body.state;

        user.save(function(err){
          if(err)
          throw err;
          console.log(user);
          res.render('pages/profile.ejs', { user: req.user  });
        })
      })
    });

//profile page
app.get('/profile', /*isLoggedIn,*/ function(req, res){
		res.render('pages/profile.ejs', { user: req.user });
});

//facebook login
app.get('/auth/facebook',  passport.authenticate('facebook', { scope: [ 'email' ] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/myPins',
                                      failureRedirect: '/' }));

//twitter auth
app.get('/auth/twitter', passport.authenticate('twitter'));
//twitter callback
app.get('/auth/twitter/callback',
       passport.authenticate('twitter', { successRedirect : '/myPins',
                                          failureRedirect : '/' }));

//google login
app.get('/auth/google',  passport.authenticate('google', { scope: [ 'profile', 'email' ] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { successRedirect:'/myPins',
                                    failureRedirect: '/' }));

// connect all sign in pages
app.get('/connect/facebook', passport.authorize('facebook', { scope: 'email' }));

app.get('/connect/myPins', passport.authenticate('twitter'));

app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email'] }));

app.get('/connect/local', function(req, res){
	res.render('pages/connect-local.ejs', { message: req.flash('signupMessage')});
});

app.post('/connect/local', passport.authenticate('local-signup', {
	successRedirect: '/profile',
	failureRedirect: '/connect/local',
	failureFlash: true
}));

//unlink all pages
app.get('/unlink/facebook', function(req, res){
		var user = req.user;
		user.facebook.token = null;
		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		})
	});

app.get('/unlink/twitter', function(req, res){
		var user = req.user;
		user.twitter.token = null;
		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		})
	});

	app.get('/unlink/local', function(req, res){
		var user = req.user;
    var city = req.city;
    var state = req.state;
    user.local.username = null;
		user.local.password = null;
		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		});
});

app.get('/unlink/google', function(req, res){
		var user = req.user;
		user.google.token = null;
		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		});
	});
  //add a pin to the database
  app.post('/addPin', function(req, res){
    var result = req.body;
    console.log('below is result');
    console.log(result);
    var allpin = [{
      name: result.name,
      url:result.webSearchUrl,
      snippet: result.name,
      thumbnail: result.thumbnailUrl,
      context: result.hostPageDisplayUrl,
      userGoogle: req.user.google,
      userFacebook: req.user.facebook,
      userTwitter: req.user.twitter
    }];
    var prettyJson = JSON.stringify(allpin, null, 4);
    console.log(prettyJson);
    console.log('I received a pin POST call');
    AllPin.create(allpin).then(function(allpin){
    });
    var allpin = new Book(allpin);
    res.redirect('/add');
  });
  // render the my pins page
  app.get('/allPins', isLoggedIn, function(req, res){
    if (req.user) {
      AllPin.find({})
      .exec(function(err, allpins){
        if (err){
          res.send('error has occured!');
        } else {
          res.render('pages/allPins', {user:req.user, allpins: allpins})
        }
      })
    }
  });

  app.get('/getAllPins', function(request, response) {
    console.log('my searchresults page!');
    //console.log(request.user);
    Pin.find({})
    .exec(function(err, pins){
      if (err){
        response.send('error has occured!');
      } else {
        console.log(pins);
        console.log('these are pins sent to searchresults page');
        response.json({user : request.user, "pins": pins});
      }
    })
  });
  // render the settings page
  app.get('/myInfo',isLoggedIn, function(request, response) {
    request.user.getCustomData(function(err, data) {
      response.render('pages/settings');
    });
  });

  app.post('/updateInfo', isLoggedIn, function(request, response) {
    request.user.getCustomData(function(err, data) {
      data.city = request.body.city;
      data.state = request.body.state;
      data.save(function() {
        request.user.givenName = request.body.firstname;
        request.user.surname = request.body.lastname;
        request.user.save();
        response.redirect("/myInfo?updated=true");
      });
    });
  });
  //move pin to all pin
  app.get('/movePin', function(req, res){
    var id = req.query.id;
    Pin.findOne({ _id: id }, function(err, pin){
      if (err) {
        res.send('error swapping');
      } else {
        var allpin = [{
          name: pin.name,
          url:pin.url,
          snippet: pin.name,
          thumbnail: pin.thumbnail,
          context: pin.hostPageDisplayUrl,
          userGoogle: req.user.google,
          userFacebook: req.user.facebook,
          userTwitter: req.user.twitter
        }];
        //console.log(allpin);
        AllPin.create(allpin).then(function(allpin){
        });
        var allpin = new AllPin(allpin);
        pin.remove();
        console.log('pin moved');
        res.redirect('/searchresults');
      }
    });
  });
  //delete pin
  app.get('/deletePin', function(req, res){
    var id = req.query.id;
    //console.log(req.query.id);
    AllPin.findOneAndRemove({ _id: id }, function(err, allpin){
      if (err) {
        res.send('error deleting');
      } else {
        console.log('Pin deleted');
        res.redirect("/myPins");
      }
    })
  });
  // render the user page of the app
  app.get('/userWall',isLoggedIn, function(req, res) {
    if (req.user) {
      res.render('pages/user', { user : req.user.email });
    }
    else if (req.session.user) {
      res.render('pages/user', { user : req.session.user});
    }
    else {
      res.render('pages/user', { user : null });
    }
  });

  // render the add image page
  app.get('/add', isLoggedIn, function(req, res){
    console.log('Add image page');
    var user = req.user;
    if (req.user) {
      res.render('pages/add', { user : req.user });
    }});

    //display search results
    app.get('/searchresults', isLoggedIn, function(req, res){
      var user = req.user;
      console.log('searchresults server page!');
      Pin.find({})
      .exec(function(err,pins){
        if(err){
          res.send('error has occured');
        } else {
          res.render('pages/searchresults', { user : req.user, pins: pins });
        }
      })
    });

    app.get('/api/recentsearchs', (req, res, next) =>{
      searchTerm.find({}, (err, data)=>{
        res.json(data);
      })
    });
app.get('/pinData', isLoggedIn, function(req, res){
    var user = req.user;
    //console.log(user);
    var cx = '003473194594510676596:h0qwalnnxi4';
    var APIKEY = 'AIzaSyBM2TSQVtDuXETHn48LwkAUV7vavs38jSI';
    var searchVal = req.query.url;
    requestify.get('https://www.googleapis.com/customsearch/v1?key=' + APIKEY + '&cx=' + cx +'&q=' + searchVal + '&searchType=image' + '&num=10').then(function(response) {
      var result1 = response.getBody();
      var result2 = result1.items;
      console.log(result1.items[0]);
      var GoogleData=[];
      for(var i=0; i<10; i++){
        GoogleData.push({
          name: result1.items[i].title,
          url:result1.items[i].link,
          context: result1.items[i].image.contextLink,
          snippet: result1.items[i].snippet,
          thumbnail: result1.items[i].link,
          userGoogle: req.user.google,
          userFacebook: req.user.facebook,
          userTwitter: req.user.twitter
        });
      }
      var pin = GoogleData;
      Pin.create(pin).then(function(pin){
        var pin = new Pin();
        //console.log(pin);
        console.log('Saved "pin" to database');
        res.redirect('/searchresults');
      })
      var prettyJson = JSON.stringify(GoogleData, null, 4);
      //console.log(prettyJson);
  })
});

//delete all pins and start new search
app.get('/newSearch', isLoggedIn, function(req, res){
  var user = req.user;
  console.log('new search started');
  Pin.remove({})
  .exec(function(err,pins){
    if(err){
      res.send('error has occured');
    } else {
      console.log('removed pins in the database');
      res.redirect('/add');
    }
  })
});
// clear the session
app.get('/clearSession', function(req, res) {
  req.session.destroy(function(err) {
    // cannot access session here
  });
  res.json({"data":"cleared"});
});

// render the my pins page
app.get('/myPins', isLoggedIn, function(req, res){
  if (req.user) {
    AllPin.find({})
    .exec(function(err, allpins){
      if (err){
        res.send('error has occured!');
      }else {
        res.render('pages/myPins', {user:req.user, allpins: allpins})
      }
    })
  }
});

//
// render the my pins page
app.get('/getUserPins', function(req, res){
  var email = req.query.email;
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    findUserImages(db, function(images) {
      db.close();
      res.json({"images":images});
    }, email);
  });
});
//If logged in
function isLoggedIn (req, res, next) {
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
};
};
