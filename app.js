
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')


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
    password: String

});

userSchema.plugin(passportLocalMongoose);


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/',function(req,res){
    res.render('home');
})

app.get('/login',function(req,res){
    res.render('login');
})

app.get('/register',function(req,res){
    res.render('register');
})

app.get('/secrets',function(req,res){
    if(req.isAuthenticated()){
        res.render('secrets');
    }
    else{
        res.redirect("/login")
    }
})

app.get('/logout', function(req, res){

  req.logout(function(err) {
    if (err) { 
        console.log(err);
     }
     else {
        
        res.redirect('/');

     }
  });
    
  });

app.post('/register',function(req,res){
    
    User.register({username:req.body.username}, req.body.password , function(err, user){

        if(err){
            console.log(err);
            res.redirect('/register');
        }
        else {
            // "Local" est une stratégie d'authentification intégrée à Passport.js qui permet d'authentifier les utilisateurs à l'aide d'informations d'identification stockées localement, telles qu'un nom d'utilisateur et un mot de passe.
            // Passport.js prend en charge plusieurs autres stratégies d'authentification en dehors de la stratégie "local". Voici quelques exemples courants de stratégies alternatives :
            // passport.authenticate("google") : pour l'authentification avec Google OAuth.
            // passport.authenticate("facebook") : pour l'authentification avec Facebook OAuth.
            // .authenticate cree une session d utilisateur et la stocke dans un cockie dans la reponse pour qu elle soit accessible par d autre methode
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets');
            });
        }

    })


     


})
 app.post("/login",function(req,res){

    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
        // le plugin passportLocalMongoose ajoute automatiquement des méthodes telles que User.authenticate() à votre modèle User pour la vérification des informations d'identification.
    
        req.login(user, function(err) {
        if (err) {
             console.log(err);
             }
        else {
            passport.authenticate("local")(req,res,function(){
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