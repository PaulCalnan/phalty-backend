const jwt = require("jsonwebtoken");
require("dotenv").config();
const expressJwt = require("express-jwt");
const User = require("../models/user");
const { validationResult } = require("express-validator");

exports.signup = async (req, res) => {
  const userExists = await User.findOne({email: req.body.email});
  if(userExists)
    return res.status(403).json({
      error: "Email is already taken!"
  });
  const user = await new User(req.body)
  const errors = validationResult(req);
  if (!errors.isEmpty()){return res.status(422).json({ error: errors.array()[0].msg });}
  await user.save();
  res.status(200).json({ message: "Signup success! Please login." });
};

exports.signin = (req, res) => {
  // find the user based on email
  const {email, password} = req.body
  User.findOne({email}, (err, user) => {
    // if err or no user
    if(err || !user) {
      return res.status(401).json({
        error: "User with that email does not exist. Please register or sign in"
      });
    }
    // if user is found make sure the email and password match
    // create authenticate method in model and use here
    if(!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and password do not match"
      });
    }
    // generate a token with user id and secret
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    // persist the token as 't' in cookie with expiry date
    res.cookie("t", token, { expire: new Date() + 9999 });
    // return response with user and token to frontend client
    const {_id, plate, email} = user;
    return res.json({token, user: { _id, email, plate }});
  });
};

exports.signout = (req, res) => {
  res.clearCookie("t");
  return res.json({message: "Signout success!"});
}

exports.requireSignin = expressJwt({
  // protect route from non signed in users
  // if the token is valid, express jwt appends the verified users id
  // into an auth key to the request object
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  userProperty: "auth"
})
