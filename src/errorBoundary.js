
export function catchError(Instance, hookname, args) {
    try {
        if (Instance[hookname]) {
            var resulte = void 666;
            if (hookname === "render") {
                resulte = Instance[hookname].apply(Instance);
            } else {
                resulte = Instance[hookname].apply(Instance, args);
            }
            return resulte;
        }
    } catch (e) {
        /*         let Vnode = void 666;
                Vnode = Instance.Vnode;
                if (hookname === "render" || hookname === "componentWillMount") {
                    Vnode = args[0];
                }
                //collectErrorVnode(e, Vnode, hookname);
        
                if (hookname !== "render") {
                    return true;
                } */
    }
}