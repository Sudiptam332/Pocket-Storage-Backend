const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.DATABASE;

const connectToMongo = async () => {
  await mongoose.connect(mongoURI);
  console.log("Connected to MongoDB.");
};

module.exports = connectToMongo;
