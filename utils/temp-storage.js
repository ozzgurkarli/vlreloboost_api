
const temporaryOrderCache = new Map();

const TTL_MS = 60 * 60 * 1000;

function set(orderId, data) {
    
    temporaryOrderCache.set(orderId, data);

    setTimeout(() => {
        if (temporaryOrderCache.has(orderId)) {
            temporaryOrderCache.delete(orderId);
        }
    }, TTL_MS);
}

function get(orderId) {
    return temporaryOrderCache.get(orderId);
}

function del(orderId) {
    if (temporaryOrderCache.has(orderId)) {
        temporaryOrderCache.delete(orderId);
    }
}

module.exports = {
    set,
    get,
    del,
};