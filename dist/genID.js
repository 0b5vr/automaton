"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function genID() {
    var ret = '';
    for (var i = 0; i < 16; i++) {
        ret += Math.floor(16.0 * Math.random()).toString(16);
    }
    return ret;
}
exports.genID = genID;
