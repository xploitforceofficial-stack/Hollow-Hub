const xss = require('xss');

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return xss(str.trim());
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
            obj[key] = sanitizeObject(obj[key]);
        }
    });
    
    return obj;
};

module.exports = { sanitizeString, sanitizeObject };
