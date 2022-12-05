const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; //Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Autenticação falhou");
    }
    const decodedToken = jwt.verify(token, "secret_dont_share");
    req.userData = {userId: decodedToken.userId}
    next();
  } catch (err) {
    const error = new HttpError("Autenticação falhou", 401);
    return next(error);
  }

 
};
