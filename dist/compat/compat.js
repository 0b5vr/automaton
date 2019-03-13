"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SerializedData_1 = require("../types/SerializedData");
var compat1_1 = require("./compat1");
var compatPreVersions_1 = require("./compatPreVersions");
function compat(data) {
    if (!data) {
        return Object.assign({}, SerializedData_1.defaultData);
    }
    var newData;
    if (typeof data === 'object') {
        newData = data;
    }
    else if (typeof data === 'string') {
        console.error('Data should be parsed JSON');
        return Object.assign({}, SerializedData_1.defaultData);
    }
    else {
        console.error('Loaded data is invalid');
        return Object.assign({}, SerializedData_1.defaultData);
    }
    var v = parseFloat(newData.v);
    if (!v && !newData.rev) {
        newData = compatPreVersions_1.compatPreVersions(newData);
        if (newData === null) {
            return Object.assign({}, SerializedData_1.defaultData);
        }
    }
    if (newData.rev) { // fuck
        v = 1.0;
        delete newData.rev;
    }
    if (v < 2.0) { // v1, modes and modifiers, CURSED
        newData = compat1_1.compat1(newData);
    }
    newData.v = process.env.VERSION;
    return newData;
}
exports.compat = compat;
exports.default = compat;
