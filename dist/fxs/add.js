"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ['add', {
        name: 'Add',
        description: 'The simplest fx ever. Just add a constant value to the curve.',
        params: {
            value: { name: 'Value', type: 'float', default: 1.0 }
        },
        func: function (context) {
            return context.v + context.params.value;
        }
    }];
