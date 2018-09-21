import { ReactClass } from "./reactClass";
import { cloneElement } from "./cloneElement";
import { Children as Child } from "./children";
import { createElement } from "./createElement";
import { render, findDOMNode } from "./render";

const React = {
    Component: ReactClass,
    createElement,
    Children: Child,
    render,
    findDOMNode,
    cloneElement
};

export const Component = ReactClass;
export const Children = Child;
export default React;