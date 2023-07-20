
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const FacebookStrategy = require('passport-facebook');



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: 'Oursecret',
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({

    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret : String

});



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



const User = mongoose.model("User", userSchema);




passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});
passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});



// Configuration de la strategie d authentifictaion google 
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        // When strategy want to find a user with googleID they cant so they created a new user because we dont have googleID in our scheme of user to let him find through
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            //Une fois que l'utilisateur est trouvé ou créé avec succès, la fonction de vérification appelle cb(null, user) pour indiquer à Passport que l'authentification est réussie.
            return cb(err, user);
        });
    }
));


// Configuration de la strategie d authentifictaion facebook 
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));





//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


// Déclenche le processus d'authentification OAuth avec Google preconfigure dans la strategie , si l utilisateur s est bien authentifie et accepte d acceder a son scope: ['profile'] rediriger vers le callbackURL
app.get("/auth/google",
    //la methode .authenticate dans ce cas va initialiser l authentification avec google 
    passport.authenticate("google", { scope: ['profile'] })
);
app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['public_profile'] }));


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++




app.get('/auth/google/secrets',
    //la metohode .authenticate dans ce cas va vérifier les informations d'authentification reçues de Google et récupérer les informations de profil de l'utilisateur.
    passport.authenticate("google", { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect secrets page.
        res.redirect('/secrets');
    });

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });



//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.get('/', function (req, res) {
    res.render('home');
})

app.get('/login', function (req, res) {
    res.render('login');
})

app.get('/register', function (req, res) {
    res.render('register');
})

app.get('/secrets', function (req, res) {

    User.find({"secret":{$ne:null}})
    .then((foundUser)=> res.render('secrets',{usersWithSecrets:foundUser}))
    .catch((err)=> console.log(err));
})


app.get('/logout', function (req, res) {

    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
        else {

            res.redirect('/');

        }
    });

});

app.get('/submit', function (req, res) {

    if (req.isAuthenticated()) {
        res.render('submit');
    }
    else {
        res.redirect("/login")
    }
})

app.post('/submit',function(req,res){

   // console.log(req.user.id);

    User.findByIdAndUpdate(req.user.id, { secret: req.body.secret }) 
    .then((resultat)=>res.redirect("/secrets"))
    .catch((err)=> console.log(err))
    
    
})

app.post('/register', function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {

        if (err) {
            console.log(err);
            res.redirect('/register');
        }
        else {
            // "Local" est une stratégie d'authentification intégrée à Passport.js qui permet d'authentifier les utilisateurs à l'aide d'informations d'identification stockées localement, telles qu'un nom d'utilisateur et un mot de passe.
            // Passport.js prend en charge plusieurs autres stratégies d'authentification en dehors de la stratégie "local". Voici quelques exemples courants de stratégies alternatives :
            // passport.authenticate("google") : pour l'authentification avec Google OAuth.
            // passport.authenticate("facebook") : pour l'authentification avec Facebook OAuth.
            // .authenticate cree une session d utilisateur et la stocke dans un cockie dans la reponse pour qu elle soit accessible par d autre methode
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            });
        }

    })

})
app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    // le plugin passportLocalMongoose ajoute automatiquement des méthodes telles que User.authenticate() à votre modèle User pour la vérification des informations d'identification.

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            });
        }
    });


})


























let port = process.env.PORT;

if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function () {
    console.log("Server is running");
});