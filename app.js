const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');


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

    const newUser = new User({ 
        email:req.body.username,
        password:req.body.password
    });
     newUser.save()
        .then((rs)=>res.render('secrets'))
        .catch((err)=>console.log(err))
     ;


})
 app.post("/login",function(req,res){

    // const username = req.body.username ;
    // const password = req.body.password ;

    //console.log(username);

    User.findOne({username:req.body.username})
        .then((foundUser)=>{ 
            console.log(foundUser)
            if(foundUser){
                console.log(foundUser.password)
                if(foundUser.password === req.body.password ){
                    res.render('secrets')
                }
                else{
                    console.log("erreur de mot de passe")
                }
            }
            else{
                console.log("user non trouve")
            }
        })
        .catch((err)=>console.log(err))

 })

























let port = process.env.PORT;

if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function () {
    console.log("Server is running");
});