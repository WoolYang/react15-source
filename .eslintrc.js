module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended", //基础配置中的已启用的规则继承
    "parserOptions": {
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true, //对象扩展运算符
            "jsx": true //jsx语法
        },
        "sourceType": "module"
    },
/*     "globals": {
        "module": true,
        "define": true,
        "expect": true,
        "it": true,
        "describe": true,
        "exports": true
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "indent": ["error", 4], //缩进
        "strict": 0,  //严格模式
        "linebreak-style": [  //使用一致的换行风格
            "error",
            "windows"
        ],
        "quotes": [  //强制使用一致的反勾号、双引号或单引号
            "error",
            "double"
        ],
        "curly": "error", //强制所有控制语句使用一致的括号风格
        "brace-style": ["error", "1tbs"], //强制在代码块中使用一致的大括号风格
        "semi": [  //要求或禁止使用分号代替 ASI
            "error",
            "always"
        ],
        "max-len": ["error", 200, 4], //强制一行的最大长度
        "one-var": ["off"],
        "no-confusing-arrow": "off",
        "react/jsx-no-bind": ["off"],
        "react/jsx-indent": [2, 4],
        "react/jsx-indent-props": [2, 4],
        "react/jsx-boolean-value": ["off"]
    } */
};


