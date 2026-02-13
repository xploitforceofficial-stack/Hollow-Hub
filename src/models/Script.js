const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    code: {
        type: String,
        required: true
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploaderName: {
        type: String,
        required: true
    },
    uploaderAvatar: {
        type: String,
        default: 'https://www.roblox.com/headshot-thumbnail/image?userId=1&width=420&height=420&format=png'
    },
    anonymous: {
        type: Boolean,
        default: false
    },
    gameName: {
        type: String,
        required: true,
        index: true
    },
    views: {
        type: Number,
        default: 0,
        index: true
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: Number,
        index: true
    }],
    reports: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'removed'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Compound Indexes
scriptSchema.index({ title: 'text', gameName: 'text', uploaderName: 'text' });
scriptSchema.index({ createdAt: -1 });
scriptSchema.index({ views: -1 });
scriptSchema.index({ likes: -1 });

module.exports = mongoose.model('Script', scriptSchema);
