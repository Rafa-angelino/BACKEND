const axios = require("axios");
const HttpError = require("../models/http-error");
const API_KEY = "AIzaSyA2y_myPUlcxNlEhUmMs_k1C0HE69D6nt4";

function getCoordsForAddress(address) {
   return {
     lat: 40.7484474,
     lng: -73.9871516
   };
}

module.exports = getCoordsForAddress;