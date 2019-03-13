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
var Automaton_1 = require("./Automaton");
var main_vue_1 = __importDefault(require("./vue/main.vue"));
var ParamWithGUI_1 = require("./ParamWithGUI");
var vue_1 = __importDefault(require("vue"));
var ass_1 = require("./ass");
var compat_1 = __importDefault(require("./compat/compat"));
var fxs_1 = __importDefault(require("./fxs"));
var jsonCopy_1 = require("./jsonCopy");
/**
 * IT'S AUTOMATON!
 * It's `automaton.js` and `automaton.min.js` version.
 * @param {Object} options Options for this Automaton instance
 */
var AutomatonWithGUI = /** @class */ (function (_super) {
    __extends(AutomatonWithGUI, _super);
    function AutomatonWithGUI(options) {
        var _this = _super.call(this, options) || this;
        /**
         * GUI settings for this automaton.
         */
        _this.guiSettings = {
            snapActive: false,
            snapTime: 0.1,
            snapValue: 0.1
        };
        /**
         * History stack.
         * Will be managed from {@link AutomatonWithGUI#pushHistory|pushHistory()}, navigated from {@link AutomatonWithGUI#undo|undo()} and {@link AutomatonWithGUI#redo|redo()}.
         */
        _this.__history = [];
        /**
         * Current position of history stack.
         */
        _this.__historyIndex = 0;
        ass_1.ass(!options.onseek, 'The handler "onseek" is no longer supported. Use Automaton.on( "seek", ... ) instead.');
        ass_1.ass(!options.onplay, 'The handler "onplay" is no longer supported. Use Automaton.on( "play", ... ) instead.');
        ass_1.ass(!options.onpause, 'The handler "onpause" is no longer supported. Use Automaton.on( "pause", ... ) instead.');
        fxs_1.default.map(function (fxDef /* TODO */) {
            _this.addFxDefinition.apply(_this, fxDef);
        });
        if (options.gui) {
            _this.__prepareGUI(options.gui);
        }
        window.addEventListener('beforeunload', function (event) {
            if (_this.__historyIndex !== 0) {
                var confirmationMessage = 'Automaton: Did you saved your progress?';
                event.returnValue = confirmationMessage;
                return confirmationMessage;
            }
        });
        return _this;
    }
    /**
     * Generate default fx params object.
     * @param id Id of the fx
     * @returns Default fx params object
     */
    AutomatonWithGUI.prototype.generateDefaultFxParams = function (id) {
        var fxDef = this.__fxDefs[id];
        if (!fxDef) {
            throw new Error("Fx definition called " + id + " is not defined");
        }
        var ret = {};
        Object.keys(fxDef.params).forEach(function (key) {
            ret[key] = fxDef.params[key].default;
        });
        return ret;
    };
    /**
     * Toggle play / pause.
     */
    AutomatonWithGUI.prototype.togglePlay = function () {
        if (this.isPlaying) {
            this.pause();
        }
        else {
            this.play();
        }
    };
    /**
     * Put some operation into the history stack.
     * Since it should accessible from GUI this function is public, it's basically `-- DON'T TOUCH IT KIDDO --`
     * @param desc Description of the operation
     * @param do Operation
     * @param undo Operation that undoes the `_do`
     * @param execute do will be executed instantly if true
     * @returns `any` if `_execute` is true, `void` otherwise
     */
    AutomatonWithGUI.prototype.pushHistory = function (description, doOperation, undoOperation, execute) {
        if (execute === void 0) { execute = false; }
        this.__history.splice(this.__historyIndex);
        this.__history.push({ description: description, doOperation: doOperation, undoOperation: undoOperation });
        this.__historyIndex++;
        if (execute) {
            return doOperation();
        }
    };
    /**
     * Undo the operation based on history stack.
     * Can be performed via GUI.
     * @returns Result of _undo
     */
    AutomatonWithGUI.prototype.undo = function () {
        if (this.__historyIndex <= 0) {
            return;
        }
        this.__historyIndex--;
        return this.__history[this.__historyIndex].undoOperation();
    };
    /**
     * Redo the operation based on history stack.
     * Can be performed via GUI.
     * @returns Result of _do
     */
    AutomatonWithGUI.prototype.redo = function () {
        if (this.__history.length <= this.__historyIndex) {
            return;
        }
        this.__historyIndex++;
        return this.__history[this.__historyIndex - 1].doOperation();
    };
    /**
     * Return description of latest operation.
     * If there are no operation before the current state, it will return empty string instead.
     * @returns Description of operation
     */
    AutomatonWithGUI.prototype.getUndoDesc = function () {
        return this.__history[this.__historyIndex - 1]
            ? this.__history[this.__historyIndex - 1].description
            : '';
    };
    /**
     * Return description of recently undo-ed operation.
     * If there are no operation after the current state, it will return empty string instead.
     * @returns Description of operation
     */
    AutomatonWithGUI.prototype.getRedoDesc = function () {
        return this.__history[this.__historyIndex]
            ? this.__history[this.__historyIndex].description
            : '';
    };
    /**
     * Drop all the history. YABAI.
     */
    AutomatonWithGUI.prototype.dropHistory = function () {
        this.__history.splice(0);
        this.__historyIndex = 0;
    };
    /**
     * Set new length for this automaton instance.
     * **Some nodes / fxs might be automatically removed / changed.**
     * Can be performed via GUI.
     * @param length New length for the automaton
     */
    AutomatonWithGUI.prototype.setLength = function (length) {
        // if length is invalid then throw error
        if (isNaN(length)) {
            throw new Error('Automaton.setLength: length is invalid');
        }
        // if length is not changed then do fast-return
        if (length === this.length) {
            return;
        }
        // changeLength is a good method
        Object.values(this.__params).forEach(function (param) { return param.changeLength(length); });
        // finally set the length
        this.__length = length;
        // It's irreversible operation, sorry
        this.dropHistory();
        // Poke vue
        if (this.__vue) {
            this.__vue.$emit('changedLength');
        }
    };
    /**
     * Set new resolution for this automaton instance.
     * @param resolultion New resolution for the automaton lul
     */
    AutomatonWithGUI.prototype.setResolution = function (resolultion) {
        this.__resolution = resolultion; // lul
        this.precalcAll();
    };
    /**
     * Create a new param.
     * @param name Name of param
     * @returns Created param
     */
    AutomatonWithGUI.prototype.createParam = function (name, data) {
        var param = new ParamWithGUI_1.ParamWithGUI(this, data);
        vue_1.default.set(this.__params, name, param);
        return param;
    };
    /**
     * Remove a param.
     * @param name Name of param
     */
    AutomatonWithGUI.prototype.removeParam = function (name) {
        vue_1.default.delete(this.__params, name);
    };
    /**
     * Get a param.
     * @param name Name of the param
     * @returns Param object
     */
    AutomatonWithGUI.prototype.getParam = function (name) {
        return this.__params[name] || null;
    };
    /**
     * Return list of name of params. Sorted.
     * @returns List of name of params
     */
    AutomatonWithGUI.prototype.getParamNames = function () {
        return Object.keys(this.__params).sort();
    };
    /**
     * Return list of id of fx definitions. Sorted.
     * @returns List of id of fx definitions
     */
    AutomatonWithGUI.prototype.getFxDefinitionIds = function () {
        return Object.keys(this.__fxDefs).sort();
    };
    /**
     * Return display name of a fx definition.
     * If it can't find the fx definition, it returns `null` instead.
     * @param id Id of the fx definition you want to grab
     * @returns Name of the fx definition
     */
    AutomatonWithGUI.prototype.getFxDefinitionName = function (id) {
        if (this.__fxDefs[id]) {
            return this.__fxDefs[id].name || id;
        }
        else {
            return null;
        }
    };
    /**
     * Return description of a fx definition.
     * If it can't find the fx definition, it returns `null` instead.
     * @param id Id of the fx definition you want to grab
     * @returns Description of the fx definition
     */
    AutomatonWithGUI.prototype.getFxDefinitionDescription = function (id) {
        if (this.__fxDefs[id]) {
            return this.__fxDefs[id].description || '';
        }
        else {
            return null;
        }
    };
    /**
     * Return params section of a fx definition.
     * If it can't find the fx definition, it returns `null` instead.
     * @param id Id of the fx definition you want to grab
     * @returns Params section
     */
    AutomatonWithGUI.prototype.getFxDefinitionParams = function (id) {
        if (this.__fxDefs[id]) {
            return jsonCopy_1.jsonCopy(this.__fxDefs[id].params || {});
        }
        else {
            return null;
        }
    };
    /**
     * Return count of params.
     * @returns Count of params
     */
    AutomatonWithGUI.prototype.countParams = function () {
        return Object.keys(this.__params).length;
    };
    /**
     * Load automaton state data.
     * @param data Object contains automaton data.
     */
    AutomatonWithGUI.prototype.load = function (data) {
        var convertedData = compat_1.default(data);
        _super.prototype.load.call(this, convertedData);
        this.guiSettings = convertedData.guiSettings;
        // Poke vue
        if (this.__vue) {
            this.__vue.$emit('loaded');
        }
        // Bye history
        if (this.__history) { // Automaton.constructor -> AutomatonWithGUI.load -> AutomatonWithGUI.dropHistory
            this.dropHistory();
        }
    };
    /**
     * Export current state as JSON.
     * @returns Saved object as JSON
     * @example
     * あとでやる
     * @todo はい
     */
    AutomatonWithGUI.prototype.save = function () {
        var _this = this;
        var ret = {
            v: this.version,
            length: this.length,
            resolution: this.resolution,
            params: {},
            guiSettings: this.guiSettings
        };
        Object.keys(this.__params).forEach(function (name) {
            var param = _this.__params[name];
            ret.params[name] = {
                nodes: param.dumpNodesWithoutId(),
                fxs: param.dumpFxsWithoutId(),
            };
        });
        return JSON.stringify(ret);
    };
    /**
     * Poke the vue renderer.
     */
    AutomatonWithGUI.prototype.pokeRenderer = function () {
        if (this.__vue) {
            this.__vue.$emit('poke');
        }
    };
    /**
     * Prepare GUI.
     * @param target DOM element where you want to attach the Automaton GUI
     */
    AutomatonWithGUI.prototype.__prepareGUI = function (target) {
        var el = document.createElement('div');
        target.appendChild(el);
        this.__vue = new vue_1.default({
            el: el,
            data: {
                automaton: this
            },
            render: function (createElement) {
                return createElement(main_vue_1.default, { props: { automaton: this.automaton } });
            }
        });
    };
    /**
     * Assigned to `Automaton.auto` at constructor.
     * @param name name of the param
     * @returns Current value of the param
     */
    AutomatonWithGUI.prototype.__auto = function (name) {
        var param = this.__params[name];
        if (!param) {
            param = this.createParam(name);
        }
        param.markAsUsed();
        return param.getValue();
    };
    return AutomatonWithGUI;
}(Automaton_1.Automaton));
exports.AutomatonWithGUI = AutomatonWithGUI;
