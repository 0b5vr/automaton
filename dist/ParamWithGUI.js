"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Param_1 = require("./Param");
var vue_1 = __importDefault(require("vue"));
var genID_1 = require("./genID");
var hasOverwrap_1 = require("./hasOverwrap");
var jsonCopy_1 = require("./jsonCopy");
/**
 * Handles of a new node will be created in this length.
 */
exports.PARAM_DEFAULT_HANDLE_LENGTH = 0.5;
exports.PARAM_FX_ROW_MAX = 4;
/**
 * Represents "Status code" of a {@link ParamStatus}.
 */
var ParamStatusCode;
(function (ParamStatusCode) {
    ParamStatusCode[ParamStatusCode["OK"] = 0] = "OK";
    ParamStatusCode[ParamStatusCode["NOT_USED"] = 1] = "NOT_USED";
    ParamStatusCode[ParamStatusCode["NAN_DETECTED"] = 2] = "NAN_DETECTED";
})(ParamStatusCode = exports.ParamStatusCode || (exports.ParamStatusCode = {}));
/**
 * Represents fatality of a {@link ParamStatus}.
 */
var ParamStatusLevel;
(function (ParamStatusLevel) {
    ParamStatusLevel[ParamStatusLevel["OK"] = 0] = "OK";
    ParamStatusLevel[ParamStatusLevel["INFO"] = 1] = "INFO";
    ParamStatusLevel[ParamStatusLevel["WARNING"] = 2] = "WARNING";
    ParamStatusLevel[ParamStatusLevel["ERROR"] = 3] = "ERROR";
})(ParamStatusLevel = exports.ParamStatusLevel || (exports.ParamStatusLevel = {}));
/**
 * It represents a param of Automaton.
 * It's `automaton.js` and `automaton.min.js` version.
 * It has even more pretty APIs yay
 * @param automaton Parent automaton
 * @param data Data of the param
 */
var ParamWithGUI = /** @class */ (function (_super) {
    __extends(ParamWithGUI, _super);
    function ParamWithGUI(automaton, data) {
        var _this = _super.call(this, automaton, data || {
            nodes: [
                {
                    time: 0.0,
                    value: 0.0,
                    out: { time: exports.PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 }
                },
                {
                    time: automaton.length,
                    value: 0.0,
                    in: { time: -exports.PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 }
                }
            ],
            fxs: []
        }) || this;
        _this.__statusList = [
            {
                code: ParamStatusCode.NOT_USED,
                level: ParamStatusLevel.WARNING,
                message: 'This param has not been used yet'
            }
        ];
        return _this;
    }
    Object.defineProperty(ParamWithGUI.prototype, "status", {
        /**
         * Its current status (warning / error).
         */
        get: function () {
            if (this.__statusList.length === 0) {
                return {
                    code: ParamStatusCode.OK,
                    level: ParamStatusLevel.OK
                };
            }
            return this.__statusList[0];
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Load a param data.
     * @param data Data of param
     */
    ParamWithGUI.prototype.load = function (data) {
        _super.prototype.load.call(this, jsonCopy_1.jsonCopy(data));
        this.__nodes.forEach(function (node) { return node.$id = genID_1.genID(); });
        this.__fxs.forEach(function (fx) { return fx.$id = genID_1.genID(); });
    };
    /**
     * Precalculate value of samples.
     */
    ParamWithGUI.prototype.precalc = function () {
        var _this = this;
        _super.prototype.precalc.call(this);
        var b = false;
        this.__values.forEach(function (v, i) {
            if (isNaN(v)) {
                _this.__values[i] = 0.0;
                b = true;
            }
        });
        this.__setStatus(b, {
            code: ParamStatusCode.NAN_DETECTED,
            level: ParamStatusLevel.ERROR,
            message: 'This param has NaN value'
        });
        this.__automaton.pokeRenderer();
    };
    /**
     * Mark this param as used.
     */
    ParamWithGUI.prototype.markAsUsed = function () {
        this.__setStatus(false, {
            code: ParamStatusCode.NOT_USED,
            level: ParamStatusLevel.WARNING
        });
    };
    /**
     * Return how many node the param currently have.
     * @returns Nodes count
     */
    ParamWithGUI.prototype.getNumNode = function () {
        return this.__nodes.length;
    };
    /**
     * Dump data of a node.
     * @param id Id of the node you want to dump
     * @returns Data of the node
     */
    ParamWithGUI.prototype.dumpNode = function (id) {
        var index = this.__getNodeIndexById(id);
        return jsonCopy_1.jsonCopy(this.__nodes[index]);
    };
    /**
     * Dump data of nodes.
     * @returns Data of nodes
     */
    ParamWithGUI.prototype.dumpNodes = function () {
        return jsonCopy_1.jsonCopy(this.__nodes);
    };
    /**
     * Dump data of nodes, without `$id`.
     * @returns Data of nodes
     */
    ParamWithGUI.prototype.dumpNodesWithoutId = function () {
        var nodes = this.dumpNodes();
        return nodes.map(function (node) {
            delete node.$id;
            return node;
        });
    };
    /**
     * Create a node.
     * @param time Time of new node
     * @param value Value of new node
     * @returns Id of the new node
     */
    ParamWithGUI.prototype.createNode = function (time, value) {
        var data = {
            $id: genID_1.genID(),
            time: time,
            value: value,
            in: { time: -exports.PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 },
            out: { time: exports.PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 }
        };
        this.__nodes.push(data);
        this.__sortNodes();
        this.precalc();
        return data.$id;
    };
    /**
     * Create a node from dumped data.
     * @param node Dumped bezier node object
     * @returns Id of the new node
     */
    ParamWithGUI.prototype.createNodeFromData = function (node) {
        var data = jsonCopy_1.jsonCopy(node);
        this.__nodes.push(data);
        this.__sortNodes();
        this.precalc();
        return data.$id;
    };
    /**
     * Remove a node.
     * @param id Id of the node you want to remove
     */
    ParamWithGUI.prototype.removeNode = function (id) {
        var index = this.__getNodeIndexById(id);
        this.__nodes.splice(index, 1);
        this.precalc();
    };
    /**
     * Move a node.
     * @param id Id of the node you want to move
     * @param time Time
     * @param value Value
     */
    ParamWithGUI.prototype.moveNode = function (id, time, value) {
        var index = this.__getNodeIndexById(id);
        var node = this.__nodes[index];
        var newTime = typeof time === 'number' ? time : node.time;
        if (index === 0) {
            newTime = 0;
        }
        else if (index === this.__nodes.length - 1) {
            newTime = this.__automaton.length;
        }
        else {
            newTime = Math.min(Math.max(newTime, this.__nodes[index - 1].time), this.__nodes[index + 1].time);
        }
        node.time = newTime;
        node.value = typeof value === 'number' ? value : node.value;
        this.precalc();
    };
    /**
     * Move a handle of a node.
     * @param id Id of the node you want to operate
     * @param isOut Input handle if false, output handle if true
     * @param time Time
     * @param value Value
     */
    ParamWithGUI.prototype.moveHandle = function (id, isOut, time, value) {
        var index = this.__getNodeIndexById(id);
        if ((index === 0 && (!isOut)) ||
            (index === (this.getNumNode() - 1) && isOut)) {
            return;
        }
        var node = this.__nodes[index];
        var handle = (isOut ? node.out : node.in);
        var newTime = typeof time === 'number' ? time : handle.time;
        if (isOut) {
            newTime = Math.max(0.0, newTime);
        }
        else {
            newTime = Math.min(0.0, newTime);
        }
        handle.time = newTime;
        handle.value = typeof value === 'number' ? value : handle.value;
        this.precalc();
    };
    /**
     * Reset a handle of a node.
     * @param id Id of the node you want to operate
     * @param isOut Input handle if false, output handle if true
     */
    ParamWithGUI.prototype.resetHandle = function (id, isOut) {
        var index = this.__getNodeIndexById(id);
        if ((index === 0 && (!isOut)) ||
            (index === (this.getNumNode() - 1) && isOut)) {
            return;
        }
        var node = this.__nodes[index];
        if (isOut) {
            node.out = { time: exports.PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 };
        }
        else {
            node.in = { time: -exports.PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 };
        }
        this.precalc();
    };
    /**
     * Dump data of a fx section.
     * @param id Id of a fx section you want to dump
     * @returns Data of the fx
     */
    ParamWithGUI.prototype.dumpFx = function (id) {
        var index = this.__getFxIndexById(id);
        return jsonCopy_1.jsonCopy(this.__fxs[index]);
    };
    /**
     * Dump data of fxs.
     * @returns Data of fxs
     */
    ParamWithGUI.prototype.dumpFxs = function () {
        return jsonCopy_1.jsonCopy(this.__fxs);
    };
    /**
     * Dump data of fxs, without `$id`.
     * @returns Data of fxs
     */
    ParamWithGUI.prototype.dumpFxsWithoutId = function () {
        var fxs = this.dumpFxs();
        return fxs.map(function (fx) {
            delete fx.$id;
            return fx;
        });
    };
    /**
     * Create a fx.
     * If it couldn't create param, it will return `null` instead.
     * @param time Beginning time of new fx
     * @param length Length of new fx
     * @param def Definition id (kind) of new fx
     * @returns Id of the new fx
     */
    ParamWithGUI.prototype.createFx = function (time, length, def) {
        var row = this.__getFreeRow(time, length);
        if (exports.PARAM_FX_ROW_MAX < row) {
            console.error('Too many fx stacks at here!');
            return null;
        }
        var data = {
            $id: genID_1.genID(),
            time: time,
            length: length,
            row: row,
            def: def,
            params: this.__automaton.generateDefaultFxParams(def)
        };
        this.__fxs.push(data);
        this.__sortFxs();
        this.precalc();
        return data.$id;
    };
    /**
     * Create a fx from dumped data.
     * If it couldn't create param, it will return empty string instead.
     * @param fx Dumped fx data
     * @returns Id of the new fx
     */
    ParamWithGUI.prototype.createFxFromData = function (fx) {
        var row = this.__getFreeRow(fx.time, fx.length, fx.row);
        if (exports.PARAM_FX_ROW_MAX < row) {
            console.error('Too many fx stacks at here!');
            return '';
        }
        var data = jsonCopy_1.jsonCopy(fx);
        data.row = row;
        this.__fxs.push(data);
        this.__sortFxs();
        this.precalc();
        return data.$id;
    };
    /**
     * Remove a fx.
     * @param id Id of the fx you want to remove
     */
    ParamWithGUI.prototype.removeFx = function (id) {
        var index = this.__getFxIndexById(id);
        this.__fxs.splice(index, 1);
        this.precalc();
    };
    /**
     * Move a fx.
     * @param id Id of the fx you want to move
     * @param time Beginning time
     */
    ParamWithGUI.prototype.moveFx = function (id, time) {
        var index = this.__getFxIndexById(id);
        var fx = this.__fxs[index];
        var sameRow = this.__fxs.filter(function (fxOp) { return fxOp.row === fx.row; });
        var indexInRow = sameRow.indexOf(fx);
        var prev = sameRow[indexInRow - 1];
        var next = sameRow[indexInRow + 1];
        var left = prev ? (prev.time + prev.length) : 0.0;
        var right = next ? next.time : this.__automaton.length;
        fx.time = Math.min(Math.max(time, left), right - fx.length);
        this.precalc();
    };
    /**
     * Change row of a fx.
     * @param id Id of the fx you want to move
     * @param row Row
     */
    ParamWithGUI.prototype.changeFxRow = function (id, row) {
        var index = this.__getFxIndexById(id);
        if (row < 0 || exports.PARAM_FX_ROW_MAX < row) {
            throw new Error("Row number " + row + " is invalid");
        }
        var fx = this.__fxs[index];
        if (fx.row === row) {
            return;
        }
        var sameRow = this.__fxs.filter(function (fxOp) { return fxOp.row === row; });
        var isValid = sameRow.every(function (fxOp) {
            return !hasOverwrap_1.hasOverwrap(fx.time, fx.length, fxOp.time, fxOp.length);
        });
        if (!isValid) {
            return;
        }
        fx.row = row;
        this.__sortFxs();
        this.precalc();
    };
    /**
     * Bypass or unbypass a fx.
     * @param id Id of the fx you want to change
     * @param bypass If true, fx will be bypassed
     */
    ParamWithGUI.prototype.bypassFx = function (id, bypass) {
        var index = this.__getFxIndexById(id);
        var fx = this.__fxs[index];
        vue_1.default.set(fx, 'bypass', !!bypass);
        this.precalc();
    };
    /**
     * Change a param of a fx.
     * @param id Id of the fx you want to change
     * @param name Name of the param you want to change
     * @param value Your desired value
     */
    ParamWithGUI.prototype.changeFxParam = function (id, name, value) {
        var index = this.__getFxIndexById(id);
        var fx = this.__fxs[index];
        var params = this.__automaton.getFxDefinitionParams(fx.def);
        var newValue = value;
        if (params[name].min !== undefined) {
            newValue = Math.max(params[name].min, newValue);
        }
        if (params[name].max !== undefined) {
            newValue = Math.min(params[name].max, newValue);
        }
        vue_1.default.set(fx.params, name, newValue);
        this.precalc();
    };
    /**
     * Move a fx --force.
     * Best for undo-redo operation. probably.
     * @param id Id of the fx you want to move
     * @param time Beginning time
     * @param row Row
     */
    ParamWithGUI.prototype.forceMoveFx = function (id, time, row) {
        var index = this.__getFxIndexById(id);
        var fx = this.__fxs[index];
        fx.time = time;
        fx.row = row;
        this.__sortFxs();
        this.precalc();
    };
    /**
     * Resize a fx.
     * @param id Index of the fx you want to resize
     * @param length Length
     */
    ParamWithGUI.prototype.resizeFx = function (id, length) {
        var index = this.__getFxIndexById(id);
        var fx = this.__fxs[index];
        var sameRow = this.__fxs.filter(function (fxOp) { return fxOp.row === fx.row; });
        var indexInRow = sameRow.indexOf(fx);
        var next = sameRow[indexInRow + 1];
        var right = next ? next.time : this.__automaton.length;
        fx.length = Math.min(Math.max(length, 0.0), right - fx.time);
        this.precalc();
    };
    /**
     * Resize a fx by left side of the end.
     * It's very GUI dev friendly method. yeah.
     * @param id Index of the fx you want to resize
     * @param length Length
     */
    ParamWithGUI.prototype.resizeFxByLeft = function (id, length) {
        var index = this.__getFxIndexById(id);
        var fx = this.__fxs[index];
        var end = fx.time + fx.length;
        var sameRow = this.__fxs.filter(function (fxOp) { return fxOp.row === fx.row; });
        var indexInRow = sameRow.indexOf(fx);
        var prev = sameRow[indexInRow - 1];
        var left = prev ? (prev.time + prev.length) : 0.0;
        fx.length = Math.min(Math.max(length, 0.0), end - left);
        fx.time = end - fx.length;
        this.precalc();
    };
    /**
     * Call when you need to change automaton length.
     * This is very hardcore method. Should not be called by anywhere except {@link AutomatonWithGUI#setLength}.
     * @param length Desired length
     */
    ParamWithGUI.prototype.changeLength = function (length) {
        for (var i = this.__nodes.length - 1; 0 <= i; i--) {
            var node = this.__nodes[i];
            if (length < node.time) {
                this.__nodes.splice(i, 1);
            }
            else if (node.time === length) {
                delete node.out;
                break;
            }
            else {
                var lastNode = this.__nodes[this.__nodes.length - 1];
                if (lastNode) {
                    lastNode.out = { time: exports.PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 };
                }
                this.__nodes.push({
                    time: length,
                    value: 0.0,
                    in: { time: -exports.PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 },
                    $id: genID_1.genID()
                });
                break;
            }
        }
        for (var i = this.__fxs.length - 1; 0 <= i; i--) {
            var fx = this.__fxs[i];
            if (length < fx.time) {
                this.__fxs.splice(i, 1);
            }
            else if (length < fx.time + fx.length) {
                fx.length = length - fx.time;
            }
        }
        this.__values = new Float32Array(this.__automaton.resolution * length + 1);
        this.precalc();
    };
    /**
     * Set a status.
     * @param bool Boolean whether the status is currently active or not
     * @param status The status
     */
    ParamWithGUI.prototype.__setStatus = function (bool, status) {
        if (!this.__statusList) { // Param.constructor -> ... -> ParamWithGUI.precalc -> ParamWithGUI.__setStatus
            return;
        }
        // search for old entry, then delete it
        for (var i = 0; i < this.__statusList.length; i++) {
            if (this.__statusList[i].code === status.code) {
                this.__statusList.splice(i, 1);
                break;
            }
        }
        if (bool) {
            this.__statusList.push(status);
            this.__statusList.sort(function (a, b) { return b.level - a.level; });
        }
    };
    /**
     * Sort nodes by time.
     */
    ParamWithGUI.prototype.__sortNodes = function () {
        this.__nodes = this.__nodes.sort(function (a, b) { return a.time - b.time; });
    };
    /**
     * Search for node that has given id then return index of it.
     * If it couldn't find the node, it will throw an error instead.
     * @param id Id of node you want to grab
     * @returns The index of the node
     */
    ParamWithGUI.prototype.__getNodeIndexById = function (id) {
        var index = this.__nodes.findIndex(function (node) { return node.$id === id; });
        if (index === -1) {
            throw new Error("Searched for node id: " + id + " but not found");
        }
        return index;
    };
    /**
     * Sort fxs by time.
     */
    ParamWithGUI.prototype.__sortFxs = function () {
        this.__fxs = this.__fxs.sort(function (a, b) { return a.time - b.time; }).sort(function (a, b) { return a.row - b.row; });
    };
    /**
     * Search for fx section that has given id then return index of it.
     * If it couldn't find the section, it will throw an error instead.
     * @param id Id of section you want to grab
     * @returns The index of the section
     */
    ParamWithGUI.prototype.__getFxIndexById = function (id) {
        var index = this.__fxs.findIndex(function (fx) { return fx.$id === id; });
        if (index === -1) {
            throw new Error("Searched for fx id: " + id + " but not found");
        }
        return index;
    };
    /**
     * Search for vacance fx row for given time and length.
     * @param time Beginning time of fx
     * @param length Length of fx
     * @param row If given, rows lower than this value will not be searched.
     * @returns Minimal free fx row
     */
    ParamWithGUI.prototype.__getFreeRow = function (_time, _length, _row) {
        if (_row === void 0) { _row = 0; }
        var row = _row || 0;
        for (var iFx = 0; iFx < this.__fxs.length; iFx++) {
            var fx = this.__fxs[iFx];
            if (fx.row < row) {
                continue;
            }
            if (row < fx.row) {
                break;
            }
            if (hasOverwrap_1.hasOverwrap(_time, _length, fx.time, fx.length)) {
                row++;
            }
        }
        return row;
    };
    return ParamWithGUI;
}(Param_1.Param));
exports.ParamWithGUI = ParamWithGUI;
exports.default = ParamWithGUI;
