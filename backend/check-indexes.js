require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const indexes = await Room.collection.getIndexes();
    console.log('Indexes:', indexes);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });