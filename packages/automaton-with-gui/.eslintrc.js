module.exports = {
    "plugins": [
        "sort-imports-es6-autofix",
        "react-hooks",
    ],

    "env": {
        "browser": true
    },

    "extends": [
        "plugin:react/recommended"
    ],

    "rules": {
        "sort-imports-es6-autofix/sort-imports-es6": [ "error" ], // imports have to be ordered

        // react-specifics
        "react/jsx-no-useless-fragment": [ "error" ], // sounds good, huh
        "react/display-name": [ "error" ], // yes please, it's very important to do performance monitoring
        "react-hooks/rules-of-hooks": [ "error" ], // yes it must be followed
        "react-hooks/exhaustive-deps": [ "warn" ], // best eslint rule ever

        // typescript-specifics
        "@typescript-eslint/explicit-module-boundary-types": [ "off" ], // We are using explicit any on purpose because it's explicit, be permissive
    }
};
