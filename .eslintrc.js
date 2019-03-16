module.exports = {
    "root": true,

    "plugins": [ "@typescript-eslint" ],

    "env": {
        "es6": true,
        "browser": true,
        "commonjs": true
    },

    "parser": "@typescript-eslint/parser",

    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 2017
    },

    "extends": "eslint:recommended",

    "globals": {
        "process": true // since gulp has envify
    },

    "rules": {
        // basics
        "indent": [ "error", 2, { // indentation should be 2 spaces
            "flatTernaryExpressions": true, // ternary should be performed in flat
            "MemberExpression": 0 // member chain should be performed in flat
        } ], // it forces 2 spaces indentation
        "linebreak-style": [ "error", "unix" ], // fuck you, CRLF
        "quotes": [ "error", "single" ], // quotes must be single
        "eqeqeq": [ "error", "always" ], // fuck you, `==`
        "max-len": [ "error", { // don't be too long, code
            "code": 100,
            "ignoreComments": true, // comments are okay
            "ignoreStrings": true, // strings are okay
            "ignoreTemplateLiterals": true, // templates are also okay
            "ignoreRegExpLiterals": true, // regexs are also okay too
        } ],
        "sort-imports": [ "error" ], // imports have to be ordered

        // variables
        "@typescript-eslint/no-unused-vars": [ "warn" ], // draw yellow line under unused vars
        "no-undef": [ "warn" ], // draws yellow line under undefined vars
        "no-var": [ "error" ], // fuck you, var
        "prefer-const": [ "error" ], // const is better than let

        // omittables
        "semi": [ "error", "always" ], // semicolon is required
        "curly": [ "error" ], // it kills `if (foo) bar++;`
        "arrow-parens": [ "error", "always" ], // it kills `arg => { func(); }`

        // force spacing (I prefer super sparse code!)
        "array-bracket-spacing": [ "error", "always" ], // it kills `[val1, val2]`
        "arrow-spacing": [ "error", { "before": true, "after": true } ], // it kills `( arg )=>{ func(); }`
        "block-spacing": [ "error", "always" ], // it kills `if ( cond ) {func();}`
        "comma-spacing": [ "error", { "before": false, "after": true } ], // it kills `func( arg1,arg2 )`
        "computed-property-spacing": [ "error", "always" ], // it kills `arr[i]`
        "key-spacing": [ "error", { "beforeColon": false, "afterColon": true } ], // it kills `{ key:val }`
        "keyword-spacing": [ "error", { "before": true, "after": true } ], // it kills `}else{`
        "object-curly-spacing": [ "error", "always" ], // it kills `{key: val}`
        "semi-spacing": [ "error", { "before": false, "after": true } ], // it kills `func1();func2();`
        "space-before-blocks": [ "error", "always" ], // it kills `if (cond){`
        "space-in-parens": [ "error", "always" ], // it kills `func (arg)`
        "space-infix-ops": [ "error" ], // it kills val1+val2
        "space-unary-ops": [ "error", { "words": true, "nonwords": false, "overrides": { "++": true, "--": true } } ], // it kills `val++`
        "spaced-comment": [ "error", "always" ], // it kills `//this is comment`

        // ban spacing
        "func-call-spacing": [ "error", "never" ], // no-trailing-spaces. yea.
        "no-trailing-spaces": [ "error" ], // no-trailing-spaces. yea.
        "no-whitespace-before-property": [ "error" ], // it kills `obj .key`
        "space-before-function-paren": [ "error", { "anonymous": "never", "named": "never", "asyncArrow": "always" } ], // it kills `func ()`

        // others
        "no-eval": [ "warn" ], // nope
        "no-implied-eval": [ "warn" ], // ok don't
        "no-console": [ "error", { allow: [ "info", "warn", "error" ] } ], // don't forget to remove `console.log` !

        // typescript-specifics
        "@typescript-eslint/explicit-function-return-type": [ "error" ], // return type is required
        "@typescript-eslint/explicit-member-accessibility": [ "error" ], // `public` / `private` for members and methods are required
    }
};