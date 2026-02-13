const NodeCache = require('node-cache');

class CacheService {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: parseInt(process.env.CACHE_TTL) || 300,
            checkperiod: 120
        });
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, value, ttl = 300) {
        return this.cache.set(key, value, ttl);
    }

    del(key) {
        return this.cache.del(key);
    }

    flush() {
        return this.cache.flushAll();
    }
}

module.exports = new CacheService();
