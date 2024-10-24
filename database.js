const mongoose = require('mongoose');
require('dotenv').config()

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    log: [{
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        date: { 
            type: Date,
            default: Date.now
        }
    }]
});

// We add this middleware to format dates before sending
userSchema.set('toJSON', {
    transform: function(doc, ret) {
        if (ret.log) {
            ret.log = ret.log.map(exercise => ({
                ...exercise,
                date: new Date(exercise.date).toDateString()
            }));
        }
        return ret;
    }
});

// Make sure you have your MongoDB connection here
mongoose.connect(process.env.URI);


const User = mongoose.model('User', userSchema);

module.exports = User;
