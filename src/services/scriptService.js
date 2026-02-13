const Script = require('../models/Script');
const User = require('../models/User');
const cacheService = require('./cacheService');

class ScriptService {
    async createScript(data, user) {
        const script = await Script.create({
            ...data,
            uploader: user._id,
            uploaderName: user.username,
            uploaderAvatar: user.avatarUrl
        });

        await User.findByIdAndUpdate(user._id, {
            $inc: { uploadCount: 1 }
        });

        return script;
    }

    async getAllScripts(page = 1, limit = 20, filter = { status: 'active' }) {
        const skip = (page - 1) * limit;
        
        const scripts = await Script.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Script.countDocuments(filter);

        return {
            scripts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getScriptById(id) {
        // Try cache first
        const cached = cacheService.get(`script:${id}`);
        if (cached) return cached;

        const script = await Script.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        ).lean();

        if (script) {
            cacheService.set(`script:${id}`, script);
        }

        return script;
    }

    async likeScript(scriptId, userId) {
        const script = await Script.findById(scriptId);
        
        if (!script) {
            throw new Error('Script not found');
        }

        if (script.likedBy.includes(userId)) {
            throw new Error('Already liked');
        }

        script.likedBy.push(userId);
        script.likes += 1;
        await script.save();

        return script;
    }

    async searchScripts(query, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        
        const searchQuery = {
            $text: { $search: query },
            status: 'active'
        };

        const scripts = await Script.find(searchQuery)
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Script.countDocuments(searchQuery);

        return {
            scripts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getTrending() {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        return await Script.find({
            createdAt: { $gte: oneDayAgo },
            status: 'active'
        })
        .sort({ views: -1, likes: -1 })
        .limit(10)
        .lean();
    }
}

module.exports = new ScriptService();
