"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function compatPreVersions(data) {
    if (data.gui) {
        delete data.gui; // the gui settings are incompatible
        return data;
    }
    else {
        console.error('Loaded data is not compatible with this revision');
        return null;
    }
}
exports.compatPreVersions = compatPreVersions;
