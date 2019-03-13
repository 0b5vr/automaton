"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ass
 * @param value ass
 * @param message ass
 */
function ass(value, message) {
    if (value) {
        return true;
    }
    else {
        throw new Error(message);
    }
}
exports.ass = ass;
