const mongoose = require("mongoose");

const connectDB = async (uri) => {
  if (!uri) {
    throw new Error("Missing MongoDB connection string");
  }

  const connection = await mongoose.connect(uri);
  console.log("MongoDB connected:", connection.connection.host);
  return connection;
};

module.exports = connectDB;
