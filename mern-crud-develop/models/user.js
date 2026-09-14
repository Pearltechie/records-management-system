const mongoose = require('mongoose');
const unique = require('mongoose-unique-validator').default;

// Define the database model
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required.'],
    maxlength: [40, 'Name must not exceed 40 characters.']
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    maxlength: [40, 'Email must not exceed 40 characters.'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be valid.']
  },
  age: {
    type: Number,
    min: [5, 'Age must be at least 5.'],
    max: [130, 'Age must not exceed 130.']
  },
  gender: {
    type: String,
    enum: {
      values: ['m', 'f'],
      message: 'Gender must be m or f.'
    }
  }
});

// Use the unique validator plugin
UserSchema.plugin(unique, { message: 'That {PATH} is already taken.' });

const User = module.exports = mongoose.model('user', UserSchema);
