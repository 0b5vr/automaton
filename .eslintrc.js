module.exports = {
    "root": true,

    "plugins": [
        "@typescript-eslint",
        "sort-imports-es6-autofix",
        "react-hooks",
        "jest"
    ],

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

    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],

    "globals": {
        "process": true // since gulp has envify
    },

    "rules": {
        // basics
        "@typescript-eslint/indent": [ "error", 2, { // indentation should be 2 spaces
            "flatTernaryExpressions": true, // ternary should be performed in flat
            "MemberExpression": 1 // member chain should have 2 spaces
        } ], // it forces 2 spaces indentation
        "linebreak-style": [ "error", "unix" ], // fuck you, CRLF
        "quotes": [ "error", "single" ], // quotes must be single
        "eqeqeq": [ "error", "smart" ], // fuck you, `==`
        "max-len": [ "error", { // don't be too long, code
            "code": 100,
            "ignoreComments": true, // comments are okay
            "ignoreStrings": true, // strings are okay
            "ignoreTemplateLiterals": true, // templates are also okay
            "ignoreRegExpLiterals": true, // regexs are also okay too
        } ],
        "sort-imports": [ "off" ], // will be superceded by `sort-imports-es6-autofix/sort-imports-es6`
        "sort-imports-es6-autofix/sort-imports-es6": [ "error" ], // imports have to be ordered
        "eol-last": [ "error", "always" ], // eof newline is cool

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
        "no-eval": [ "off" ], // we need to go the evil way
        "no-implied-eval": [ "warn" ], // ok don't
        "no-console": [ "error", { allow: [ "info", "warn", "error" ] } ], // don't forget to remove `console.log` !

        // react-specifics
        "react/jsx-no-useless-fragment": [ "error" ], // sounds good, huh
        "react/display-name": [ "error" ], // yes please, it's very important to do performance monitoring
        "react-hooks/rules-of-hooks": [ "error" ], // yes it must be followed
        "react-hooks/exhaustive-deps": [ "warn" ], // best eslint rule ever

        // typescript-specifics
        "@typescript-eslint/no-explicit-any": [ "off" ], // yea
        "@typescript-eslint/no-inferrable-types": [ "off" ], // it's ok
        "@typescript-eslint/no-non-null-assertion": [ "off" ], // bang is sometimes required
        "@typescript-eslint/no-empty-interface": [ "off" ], // we need to perform mixins
        "@typescript-eslint/explicit-function-return-type": [ "error", { "allowExpressions": true } ], // return type is required
        "@typescript-eslint/explicit-member-accessibility": [ "error" ], // `public` / `private` for members and methods are required
    }
};
