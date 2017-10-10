(function(exports) {

var help = {

    // 转义HTML字符
    escapeHTML(str) {
        var entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };

        return String(str).replace(/[&<>"'`=\/]/g, c => entityMap[c]);
    },

    // 交换DOM树中两个元素节点的位置
    swapElements(obj1, obj2) {
        var temp = document.createElement('div');
        obj1.parentNode.insertBefore(temp, obj1);
        obj2.parentNode.insertBefore(obj1, obj2);
        temp.parentNode.insertBefore(obj2, temp);
        temp.parentNode.removeChild(temp);
    },

    // 根据HTML字符串创建一个元素节点
    createElement(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.firstElementChild;
    },

    insertBefore(insertNode, refNode) {
        return refNode.parentElement.insertBefore(insertNode, refNode);
    },

    insertAfter(insertNode, refNode) {
        return refNode.parentElement.insertBefore(insertNode, refNode.nextSibling);
    }
};


    
    

class BaseNode {
    constructor(data = {}) {
        this._id = this._randomID();
        this._data = data;
        this._ee = new EventEmitter();
        this.parent = null;
    }

    // 获取当前节点树的根节点
    get root() {
        var n = this;

        while(n.parent !== null) {
            n = n.parent;
        }

        return n;
    }

    get id() {
        return this._id;
    }

    get data() {
        return this._data;
    }

    // targetNode是否为当前节点的父节点(直接父节点或间接父节点)
    isParent(targetNode) {
        var parentNode = this;
        while (parentNode !== this.root) {
            parentNode = parentNode.parent;
            if(parentNode === targetNode) {
                return true;
            }
        }

        return false;
    }

    _randomID() {
        return 'i-' + parseInt(Math.random() * 10 ** 10).toString(36);
    }       

    // 替换this._data中的数据
    replaceNodeData(newData) {
        this._data = newData;
    }
    
    on(...args) {
        this._ee.on(...args);
    }

    off(...args) {
        this._ee.off(...args);
    }

    trigger(...args) {
        this._ee.trigger(...args);
    }
}






class DirNode extends BaseNode {
    constructor(data) {
        super(data);
        this.type = 'dir';
        this.children = [];
    }

    // 向当前节点插入子节点到尾部，如果插入的节点存在于树中，会先从树中移除
    insert(node) {
        if(node instanceof DirNode === false && node instanceof FileNode === false) throw new Error();
        if(node.parent != null) {
            node.remove();
        }
        node.parent = this;
        this.children.push(node);
        return node;
    }

    _insertBefore(insertNode, refNode, _insertAfter = false) {
        if(insertNode === refNode) throw new Error('InsertNode and refNode cannot be the same');        // 插入节点和参考节点是相同节点
        if(insertNode === this.root || refNode === this.root) throw new Error('insertNode and refNode cannot be the root');     // 插入节点或参考节点是root
        if(refNode.isParent(insertNode)) throw new Error('The insertNode cannot contains the refNode');     // 插入的节点是参考节点的父节点

        insertNode.remove();
        insertNode.parent = refNode.parent;     // 设置父节点

        if(_insertAfter !== true) {
            refNode.parent.children.splice(refNode._getIndex(), 0, insertNode);
        } else {
            refNode.parent.children.splice(refNode._getIndex() + 1, 0, insertNode);
        }

        return insertNode;
    }

    insertBefore(insertNode, refNode) {
        return this._insertBefore(insertNode, refNode);
    }

    insertAfter(insertNode, refNode) {
        return this._insertBefore(insertNode, refNode, true);
    }

    // 移除子节点并将子节点的parent属性置为null
    removeChildren(id) {
        var node = this.findChildren(id);
        if(node == null) throw new Error();
        var rmnodes = this.children.splice(node._getIndex(), 1);
        rmnodes[0].parent = null;
        return rmnodes[0];
    }

    // 根据ID查找子节点
    findChildren(id) {
        for(let node of this.children) {
            if(node.id === id) return node;
            if(node.type === 'dir') {
                var fdn = node.findChildren(id);
                if(fdn != null) return fdn;
            }
        }
    }

    // 根据ID查找节点，包括当前节点
    findNode(id) {
        if(this._id === id) return this;
        return this.findChildren(id);
    }

    toJSON() {
        var children = [];
        for(let node of this.children) {
            children.push(node.toJSON());
        }

        return {
            type: this.type,
            data: this._data,
            children: children
        }
    }

    static from(treeobj) {
        if(typeof treeobj !== 'object') throw new Error();
        if(treeobj.type !== 'dir') throw new Error();

        var tree = new DirNode(treeobj.data);
        for(let nodeobj of treeobj.children) {
            if(nodeobj.type === 'file') {
                tree.insert(new FileNode(nodeobj.data));
            } else if (nodeobj.type === 'dir') {
                tree.insert(DirNode.from(nodeobj));
            } else {
                throw new Error();
            }
        }

        return tree;
    }
}


class FileNode extends BaseNode {
    constructor(data) {
        super(data);
        this.type = 'file';
        this.children = null;   // FileNode没有子节点
    }

    toJSON() {
        return {
            type: this.type,
            data: this._data
        }
    }
}


// FileNode和DirNode共有的方法
var nodeMethod = {
    
    // 从父节点移除当前节点（注：节点的parent属性会被重置为null
    remove() {
        if(this.parent === null) throw new Error('Cannot remove the root node');
        return this.parent.removeChildren(this._id);
    },

    // 交换两个节点的位置，两个节点间不应该为父子关系
    swapWith(targetNode) {
        if(targetNode instanceof BaseNode === false) throw new Error();
        if(this.isParent(targetNode) || targetNode.isParent(this)) throw new Error('Cannot swap each other, beacuse they are parent-child relationship');

        var thisIdx = this._getIndex(), targetIdx = targetNode._getIndex(),
            thisParent = this.parent, targetParent = targetNode.parent;

        // 交换两个节点
        [this.parent.children[thisIdx], targetNode.parent.children[targetIdx]] = [targetNode, this];

        // 交换两个节点的parent属性指向
        [this.parent, targetNode.parent] = [targetParent, thisParent];
        
    },

    _getIndex() {
        if(this.parent == null || this.parent.children == null) return null;
        return this.parent.children.indexOf(this);
    }
}

Object.assign(DirNode.prototype, nodeMethod);
Object.assign(FileNode.prototype, nodeMethod);





class FileNodeView extends FileNode {
    constructor(data, titleAttribute) {
        super(data);
        this.titleAttribute = titleAttribute;

        var viewel = this._makeView();
        this.el = viewel.el;
        this.el_title = viewel.el_title;
    }

    _makeView () {
        var tfile = (id, name) => `
            <div class="tree-file" data-id=${help.escapeHTML(id)}>
                <div class="tree-element" draggable="true">
                    <span class="title">${help.escapeHTML(name)}</span>
                    <span class="rm-btn">删除</span>
                    <span class="edit-btn">修改</span>
                </div>
            </div>`;

        var el = help.createElement(tfile(this._id, this._data[this.titleAttribute]));

        return {
            el: el,
            el_title: el.querySelector('.title')
        }
    }
}

class DirNodeView extends DirNode {
    constructor(data, titleAttribute) {
        super(data);
        this.titleAttribute = titleAttribute;

        var viewel = this._makeView();
        this.el = viewel.el;
        this.el_title = viewel.el_title;

    }

    _makeView () {
        var tdir = (id, name) => `
            <div class="tree-dir" data-id=${help.escapeHTML(id)}>
                <div class="tree-element" draggable="true">
                    <span class="title">${help.escapeHTML(name)}</span>
                    <span class="rm-btn">删除</span>
                    <span class="add-btn">添加</span>
                    <span class="edit-btn">修改</span>
                </div>
            </div>`;

        var el = help.createElement(tdir(this._id, this._data[this.titleAttribute]));
        return {
            el: el,
            el_title: el.querySelector('.title')
        }
    }

    insert(node, index = undefined) {
        if(node instanceof FileNodeView === false && node instanceof DirNodeView === false) throw new Error();

        super.insert(node, index);
        this.el.appendChild(node.el);

        return node;
    }

    removeChildren(id) {
        var rmnode = super.removeChildren(id);
        rmnode.el.parentElement.removeChild(rmnode.el);
        return rmnode;
    }

    insertBefore(insertNode, refNode) {
        super.insertBefore(insertNode, refNode);
        help.insertBefore(insertNode.el, refNode.el);
        return insertNode;
    }

    insertAfter(insertNode, refNode) {
        super.insertAfter(insertNode, refNode);
        help.insertAfter(insertNode.el, refNode.el);
        return insertNode;
    }

    // 在根节点调用该函数，完成整个目录树的事件监听等任务
    initRoot() {

        // 监听文件树中 删除/编辑/添加 按钮被点击的事件
        this.el.addEventListener('click', ev => {

            var nodeel = ev.target.parentElement.parentElement;
            var node = this.findNode(nodeel.getAttribute('data-id'));

            if(ev.target.classList.contains('rm-btn')) {

                // 向根节点触发remove事件，携带当前节点作为参数
                this.trigger('remove', [node]);
                ev.stopPropagation();
            }
            if(ev.target.classList.contains('edit-btn')) {
                
                // 向根节点触发edit事件
                this.trigger('edit', [node]);
                ev.stopPropagation();
            }
            if(ev.target.classList.contains('add-btn')) {

                // 向根节点触发insert事件
                this.trigger('insert', [node]);
                ev.stopPropagation();
            }
        });

        // 监听文件树目录被点击的事件
        this.el.addEventListener('click', ev => {

            var nodeel = ev.target.parentElement;
            var node = this.findNode(nodeel.getAttribute('data-id'));

            if(ev.target.classList.contains('tree-element') && ev.target.parentElement.classList.contains('tree-dir')) {
                
                node.toggleExpand();
                ev.stopPropagation();
            }
        });

        // 监听拖拽事件
        this.el.addEventListener('dragstart', ev => {
            if(ev.target.classList.contains('tree-element')) {
                ev.dataTransfer.setData("text", ev.target.parentElement.getAttribute('data-id'));
            }
        });
        this.el.addEventListener('dragover', ev => {
            if(ev.target.classList.contains('tree-element')) {
                ev.preventDefault();
            }
        });
        this.el.addEventListener('dragenter', ev => {

            // ie10/11 需要阻止dragenter的默认事件
            if(ev.target.classList.contains('tree-element')) {
                ev.preventDefault();
            }
        });
        this.el.addEventListener('dragleave', ev => {
            // 
        });
        this.el.addEventListener('drop', ev => {
            if(ev.target.classList.contains('tree-element')) {
                var dragNode = this.root.findNode(ev.dataTransfer.getData('text')),
                    targetNode = this.root.findNode(ev.target.parentElement.getAttribute('data-id'));

                // 向根节点触发dropin事件
                this.trigger('dropin', [dragNode, targetNode]);
                ev.preventDefault();
            }                    
        });

        // 移除根节点的删除按钮，因为根节点不应该被删除
        var treeElement = this.el.querySelector('.tree-element');
        treeElement.removeChild(treeElement.querySelector('.rm-btn'));
    }

    // 给当前节点的元素添加expanded类
    expand() {
        this.el.classList.add('expanded');
    }
    
    // 给当前节点的元素移除expanded类
    contract() {
        this.el.classList.remove('expanded');
    }

    // 给当前节点的元素切换expanded类
    toggleExpand() {
        this.el.classList.toggle('expanded');
    }

    static from(treeobj, titleAttribute) {
        if(typeof treeobj !== 'object') throw new Error();
        if(treeobj.type !== 'dir') throw new Error();

        var tree = new DirNodeView(treeobj.data, titleAttribute);
        for(let nodeobj of treeobj.children) {
            if(nodeobj.type === 'file') {
                tree.insert(new FileNodeView(nodeobj.data, titleAttribute));
            } else if (nodeobj.type === 'dir') {
                tree.insert(DirNodeView.from(nodeobj, titleAttribute));
            } else {
                throw new Error();
            }
        }

        return tree;
    }
}


// FileNodeView和DirNodeView共有的方法
var nodeViewMethod = {

    swapWith(targetNode) {
        if(targetNode instanceof DirNodeView === false && targetNode instanceof FileNodeView === false) throw new Error();
        var _super = Object.getPrototypeOf(Object.getPrototypeOf(this));
        _super.swapWith.call(this, targetNode);    // super(targetNode)
        help.swapElements(this.el, targetNode.el);
    },

    replaceNodeData(data) {
        var _super = Object.getPrototypeOf(Object.getPrototypeOf(this));
        _super.replaceNodeData.call(this, data);
        this.el_title.innerText = this._data[this.titleAttribute];
    }
};


Object.assign(DirNodeView.prototype, nodeViewMethod);
Object.assign(FileNodeView.prototype, nodeViewMethod);

// 导出方法
Object.assign(exports, {
    DirNode,
    FileNode,
    DirNodeView,
    FileNodeView
});
})(window);
