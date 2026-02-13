const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    robloxUserId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    avatarUrl: {
        type: String,
        default: 'https://www.roblox.com/headshot-thumbnail/image?userId=1&width=420&height=420&format=png'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'verified'],
        default: 'user'
    },
    uploadCount: {
        type: Number,
        default: 0
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userSchema.index({ robloxUserId: 1 });
userSchema.index({ username: 'text' });

module.exports = mongoose.model('User', userSchema);
