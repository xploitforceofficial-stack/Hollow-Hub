const scriptService = require('../services/scriptService');
const cacheService = require('../services/cacheService');

class ScriptController {
    async uploadScript(req, res, next) {
        try {
            const { title, description, code, anonymous, gameName } = req.body;
            
            // Check for duplicate spam
            const existingScript = await Script.findOne({
                code: code,
                uploader: req.user._id,
                createdAt: { $gte: new Date(Date.now() - 3600000) } // Last hour
            });

            if (existingScript) {
                return res.status(429).json({
                    success: false,
                    message: 'Duplicate script detected. Please wait before uploading again.'
                });
            }

            const script = await scriptService.createScript({
                title,
                description,
                code,
                anonymous: anonymous || false,
                gameName
            }, req.user);

            res.status(201).json({
                success: true,
                data: script
            });
        } catch (error) {
            next(error);
        }
    }

    async getScripts(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            
            const result = await scriptService.getAllScripts(page, limit);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getScriptDetail(req, res, next) {
        try {
            const script = await scriptService.getScriptById(req.params.id);
            
            if (!script) {
                return res.status(404).json({
                    success: false,
                    message: 'Script not found'
                });
            }

            res.json({
                success: true,
                data: script
            });
        } catch (error) {
            next(error);
        }
    }

    async likeScript(req, res, next) {
        try {
            const script = await scriptService.likeScript(
                req.params.id,
                req.user.robloxUserId
            );

            res.json({
                success: true,
                data: {
                    likes: script.likes,
                    likedBy: script.likedBy
                }
            });
        } catch (error) {
            if (error.message === 'Already liked') {
                return res.status(400).json({
                    success: false,
                    message: 'You have already liked this script'
                });
            }
            next(error);
        }
    }

    async searchScripts(req, res, next) {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query required'
                });
            }

            const result = await scriptService.searchScripts(q, page);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteScript(req, res, next) {
        try {
            await Script.findByIdAndDelete(req.params.id);
            
            // Clear cache
            cacheService.del(`script:${req.params.id}`);
            
            res.json({
                success: true,
                message: 'Script deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async editScript(req, res, next) {
        try {
            const { title, description, code, gameName } = req.body;
            
            const script = await Script.findByIdAndUpdate(
                req.params.id,
                {
                    title,
                    description,
                    code,
                    gameName,
                    updatedAt: Date.now()
                },
                { new: true }
            );

            // Clear cache
            cacheService.del(`script:${req.params.id}`);

            res.json({
                success: true,
                data: script
            });
        } catch (error) {
            next(error);
        }
    }

    async getTrending(req, res, next) {
        try {
            const trending = await scriptService.getTrending();
            
            res.json({
                success: true,
                data: trending
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ScriptController();
