const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
    async loginOrRegister(robloxUserId, username, avatarUrl) {
        try {
            let user = await User.findOne({ robloxUserId });
            
            if (!user) {
                user = await User.create({
                    robloxUserId,
                    username,
                    avatarUrl: avatarUrl || `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxUserId}&width=420&height=420&format=png`,
                    role: 'user',
                    uploadCount: 0
                });
            } else {
                user.username = username;
                if (avatarUrl) user.avatarUrl = avatarUrl;
                user.lastActive = Date.now();
                await user.save();
            }

            const token = this.generateToken(user);
            return { user, token };
        } catch (error) {
            throw error;
        }
    }

    generateToken(user) {
        return jwt.sign(
            { 
                userId: user._id, 
                robloxUserId: user.robloxUserId,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
    }
}

module.exports = new AuthService();
