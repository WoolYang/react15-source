const _type = Object.prototype.toString;
//类型数字映射
const mapType = {
    "[object Boolean]": 2,
    "[object Number]": 3,
    "[object String]": 4,
    "[object Function]": 5,
    "[object Symbol]": 6,
    "[object Array]": 7
};

const specialStyle = {
    zIndex: 1
};

//映射数据类型为数字
export function typeNumber(data) {
    if (data === null) {
        return 1;
    }
    if (data === undefined) {
        return 0;
    }
    var a = mapType[_type.call(data)];
    return a || 8;
}

//自定给specialStyle外的style配置默认单位
export function styleHelper(styleName, styleNumber) {
    if (typeNumber(styleNumber) === 3) {
        const style = specialStyle[styleName] ? styleNumber : styleNumber + "px";
        return style;
    }
    return styleNumber;
}

//比对新旧vnode
export function isSameVnode(pre, next) {
    if (pre.type === next.type && pre.key === next.key) {
        return true;
    }
    return false;
}

//映射节点key值为索引
export function mapKeyToIndex(old) {
    let hascode = {};
    old.forEach((el, index) => {
        if (el.key) {
            hascode[el.key] = index;
        }
    });
    return hascode;
}

//匹配事件属性
export function isEventName(name) {
    return /^on[A-Z]/.test(name);
}

export function isEventNameLowerCase(name) {
    return /^on[a-z]/.test(name);
}

//对象浅拷贝
export function extend(obj, props) {
    for (let i in props) {
        obj[i] = props[i];
    }
    return obj;
}

//空函数
export const noop = () => { };