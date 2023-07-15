
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({

    username: String,
    password: String

});


const User = mongoose.model("User", userSchema);


app.get('/',function(req,res){
    res.render('home');
})

app.get('/login',function(req,res){
    res.render('login');
})

app.get('/register',function(req,res){
    res.render('register');
})

app.post('/register',function(req,res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

        const newUser = new User({ 
            username:req.body.username,
            password:hash
        });
         newUser.save()
            .then((rs)=>res.render('secrets'))
            .catch((err)=>console.log(err))
         ;
    });

})
 app.post("/login",function(req,res){

    const reqUsername = req.body.username
    const reqPassword = req.body.password


     User.findOne({ username: reqUsername })
         .then((foundUser) => {
             if (foundUser) {                
                 bcrypt.compare(reqPassword, foundUser.password, function (err, result) {
                     if (result) {
                         res.render('secrets')
                     }
                     if (err) {
                         console.log(err)
                     }
                 });
             }

             else {
                 console.log("user non trouve")
             }
         })
         .catch((err) => console.log(err))

 })

























let port = process.env.PORT;

if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function () {
    console.log("Server is running");
});