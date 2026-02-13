const authService = require('../services/authService');

class AuthController {
    async login(req, res, next) {
        try {
            const { robloxUserId, username, avatarUrl } = req.body;

            if (!robloxUserId || !username) {
                return res.status(400).json({
                    success: false,
                    message: 'robloxUserId and username required'
                });
            }

            const { user, token } = await authService.loginOrRegister(
                robloxUserId,
                username,
                avatarUrl
            );

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        role: user.role,
                        avatarUrl: user.avatarUrl,
                        uploadCount: user.uploadCount
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async verify(req, res, next) {
        try {
            res.json({
                success: true,
                data: {
                    user: req.user
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
