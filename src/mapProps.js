import { styleHelper, isEventName, noop } from "./utils";
import { SyntheticEvent } from "./event";
//属性生成器，策略模式
export function mapProps(domNode, props, Vnode) {

    if (Vnode && typeof Vnode.type === "function") {
        return; //节点类型是自定义组件时不处理
    }


    for (let propsName in props) {
        if (propsName === "children") {
            continue;
        }

        if (isEventName(propsName)) {
            let eventName = propsName.slice(2).toLowerCase(); //
            mappingStrategy["event"](domNode, props[propsName], eventName);
            continue;
        }

        if (typeof mappingStrategy[propsName] === "function") {
            mappingStrategy[propsName](domNode, props[propsName]);
        }
        if (mappingStrategy[propsName] === undefined) {
            mappingStrategy["otherProps"](domNode, props[propsName], propsName);
        }
    }
}

//属性比对
export function updateProps(oldProps, newProps, hostNode) {
    for (let name in oldProps) {//修改原来有的属性
        if (name === "children") {
            continue;
        }

        if (oldProps[name] !== newProps[name]) {
            mapProps(hostNode, newProps);
        }
    }

    let restProps = {};
    for (let newName in newProps) {//新增原来没有的属性
        if (oldProps[newName] === void 666) {
            restProps[newName] = newProps[newName];
        }
    }
    mapProps(hostNode, restProps);
}

let registerdEvent = {};

export const mappingStrategy = {
    style: function (domNode, style) { //样式
        if (style !== void 666) {
            Object.keys(style).forEach((styleName) => {
                domNode.style[styleName] = styleHelper(styleName, style[styleName]);
            });
        }
    },
    className: function (domNode, className) { //类名
        if (className !== void 666) {
            domNode.className = className;
        }
    },
    dangerouslySetInnerHTML: function (domNode, html) { //插入html
        let oldhtml = domNode.innerHTML;
        if (html.__html !== oldhtml) {
            domNode.innerHTML = html.__html;
        }
    },
    otherProps: function (domNode, prop, propName) { //其他属性
        if (prop !== void 666 || propName !== void 666) {
            domNode[propName] = prop;
        }
    },
    clearEvents: function (domNode, eventCb, eventName) {
        let events = domNode.__events || {};
        events[eventName] = noop;
        domNode.__events = events;//用于triggerEventByPath中获取event
    },
    event: function (domNode, eventCb, eventName) {
        let events = domNode.__events || {};
        events[eventName] = eventCb;
        domNode.__events = events;//用于triggerEventByPath中获取event

        if (!registerdEvent[eventName]) {//所有事件只注册一次
            registerdEvent[eventName] = 1;

            addEvent(document, dispatchEvent, eventName);
        }
    },
};

function addEvent(domNode, fn, eventName) {
    if (domNode.addEventListener) {
        domNode.addEventListener(eventName, fn, false);

    } else if (domNode.attachEvent) {
        domNode.attachEvent("on" + eventName, fn);
    }
}

function dispatchEvent(event, eventName, end) {
    const path = getEventPath(event, end);
    let E = new SyntheticEvent(event);
    if (eventName) {
        E.type = eventName;
    }

    triggerEventByPath(E, path);//触发event默认以冒泡形式
}

function triggerEventByPath(e, path) {
    const thisEvenType = e.type;
    for (let i = 0; i < path.length; i++) {
        const events = path[i].__events;
        for (let eventName in events) {
            let fn = events[eventName];
            e.currentTarget = path[i];
            if (typeof fn === "function" && thisEvenType === eventName) {

                fn.call(path[i], e);//触发回调函数默认以冒泡形式
            }
        }
    }
}

export function getEventPath(event, end) {
    let path = [];
    // let pathEnd = end || document;
    let begin = event.target;

    while (1) {
        if (begin.__events) {
            path.push(begin);
        }
        begin = begin.parentNode;//迭代

        if (!begin) {
            break;
        }
    }
    return path;
}


