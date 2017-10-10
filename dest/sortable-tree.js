'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {

    var help = {

        // 转义HTML字符
        escapeHTML: function escapeHTML(str) {
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

            return String(str).replace(/[&<>"'`=\/]/g, function (c) {
                return entityMap[c];
            });
        },


        // 交换DOM树中两个元素节点的位置
        swapElements: function swapElements(obj1, obj2) {
            var temp = document.createElement('div');
            obj1.parentNode.insertBefore(temp, obj1);
            obj2.parentNode.insertBefore(obj1, obj2);
            temp.parentNode.insertBefore(obj2, temp);
            temp.parentNode.removeChild(temp);
        },


        // 根据HTML字符串创建一个元素节点
        createElement: function createElement(html) {
            var div = document.createElement('div');
            div.innerHTML = html;
            return div.firstElementChild;
        },
        insertBefore: function insertBefore(insertNode, refNode) {
            return refNode.parentElement.insertBefore(insertNode, refNode);
        },
        insertAfter: function insertAfter(insertNode, refNode) {
            return refNode.parentElement.insertBefore(insertNode, refNode.nextSibling);
        }
    };

    var BaseNode = function () {
        function BaseNode() {
            var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            _classCallCheck(this, BaseNode);

            this._id = this._randomID();
            this._data = data;
            this._ee = new EventEmitter();
            this.parent = null;
        }

        // 获取当前节点树的根节点


        _createClass(BaseNode, [{
            key: 'isParent',


            // targetNode是否为当前节点的父节点(直接父节点或间接父节点)
            value: function isParent(targetNode) {
                var parentNode = this;
                while (parentNode !== this.root) {
                    parentNode = parentNode.parent;
                    if (parentNode === targetNode) {
                        return true;
                    }
                }

                return false;
            }
        }, {
            key: '_randomID',
            value: function _randomID() {
                return 'i-' + parseInt(Math.random() * Math.pow(10, 10)).toString(36);
            }

            // 替换this._data中的数据

        }, {
            key: 'replaceNodeData',
            value: function replaceNodeData(newData) {
                this._data = newData;
            }
        }, {
            key: 'on',
            value: function on() {
                var _ee;

                (_ee = this._ee).on.apply(_ee, arguments);
            }
        }, {
            key: 'off',
            value: function off() {
                var _ee2;

                (_ee2 = this._ee).off.apply(_ee2, arguments);
            }
        }, {
            key: 'trigger',
            value: function trigger() {
                var _ee3;

                (_ee3 = this._ee).trigger.apply(_ee3, arguments);
            }
        }, {
            key: 'root',
            get: function get() {
                var n = this;

                while (n.parent !== null) {
                    n = n.parent;
                }

                return n;
            }
        }, {
            key: 'id',
            get: function get() {
                return this._id;
            }
        }, {
            key: 'data',
            get: function get() {
                return this._data;
            }
        }]);

        return BaseNode;
    }();

    var DirNode = function (_BaseNode) {
        _inherits(DirNode, _BaseNode);

        function DirNode(data) {
            _classCallCheck(this, DirNode);

            var _this = _possibleConstructorReturn(this, (DirNode.__proto__ || Object.getPrototypeOf(DirNode)).call(this, data));

            _this.type = 'dir';
            _this.children = [];
            return _this;
        }

        // 向当前节点插入子节点到尾部，如果插入的节点存在于树中，会先从树中移除


        _createClass(DirNode, [{
            key: 'insert',
            value: function insert(node) {
                if (node instanceof DirNode === false && node instanceof FileNode === false) throw new Error();
                if (node.parent != null) {
                    node.remove();
                }
                node.parent = this;
                this.children.push(node);
                return node;
            }
        }, {
            key: '_insertBefore',
            value: function _insertBefore(insertNode, refNode) {
                var _insertAfter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

                if (insertNode === refNode) throw new Error('InsertNode and refNode cannot be the same'); // 插入节点和参考节点是相同节点
                if (insertNode === this.root || refNode === this.root) throw new Error('insertNode and refNode cannot be the root'); // 插入节点或参考节点是root
                if (refNode.isParent(insertNode)) throw new Error('The insertNode cannot contains the refNode'); // 插入的节点是参考节点的父节点

                insertNode.remove();
                insertNode.parent = refNode.parent; // 设置父节点

                if (_insertAfter !== true) {
                    refNode.parent.children.splice(refNode._getIndex(), 0, insertNode);
                } else {
                    refNode.parent.children.splice(refNode._getIndex() + 1, 0, insertNode);
                }

                return insertNode;
            }
        }, {
            key: 'insertBefore',
            value: function insertBefore(insertNode, refNode) {
                return this._insertBefore(insertNode, refNode);
            }
        }, {
            key: 'insertAfter',
            value: function insertAfter(insertNode, refNode) {
                return this._insertBefore(insertNode, refNode, true);
            }

            // 移除子节点并将子节点的parent属性置为null

        }, {
            key: 'removeChildren',
            value: function removeChildren(id) {
                var node = this.findChildren(id);
                if (node == null) throw new Error();
                var rmnodes = this.children.splice(node._getIndex(), 1);
                rmnodes[0].parent = null;
                return rmnodes[0];
            }

            // 根据ID查找子节点

        }, {
            key: 'findChildren',
            value: function findChildren(id) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var node = _step.value;

                        if (node.id === id) return node;
                        if (node.type === 'dir') {
                            var fdn = node.findChildren(id);
                            if (fdn != null) return fdn;
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }

            // 根据ID查找节点，包括当前节点

        }, {
            key: 'findNode',
            value: function findNode(id) {
                if (this._id === id) return this;
                return this.findChildren(id);
            }
        }, {
            key: 'toJSON',
            value: function toJSON() {
                var children = [];
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = this.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var node = _step2.value;

                        children.push(node.toJSON());
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                return {
                    type: this.type,
                    data: this._data,
                    children: children
                };
            }
        }], [{
            key: 'from',
            value: function from(treeobj) {
                if ((typeof treeobj === 'undefined' ? 'undefined' : _typeof(treeobj)) !== 'object') throw new Error();
                if (treeobj.type !== 'dir') throw new Error();

                var tree = new DirNode(treeobj.data);
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = treeobj.children[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var nodeobj = _step3.value;

                        if (nodeobj.type === 'file') {
                            tree.insert(new FileNode(nodeobj.data));
                        } else if (nodeobj.type === 'dir') {
                            tree.insert(DirNode.from(nodeobj));
                        } else {
                            throw new Error();
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                return tree;
            }
        }]);

        return DirNode;
    }(BaseNode);

    var FileNode = function (_BaseNode2) {
        _inherits(FileNode, _BaseNode2);

        function FileNode(data) {
            _classCallCheck(this, FileNode);

            var _this2 = _possibleConstructorReturn(this, (FileNode.__proto__ || Object.getPrototypeOf(FileNode)).call(this, data));

            _this2.type = 'file';
            _this2.children = null; // FileNode没有子节点
            return _this2;
        }

        _createClass(FileNode, [{
            key: 'toJSON',
            value: function toJSON() {
                return {
                    type: this.type,
                    data: this._data
                };
            }
        }]);

        return FileNode;
    }(BaseNode);

    // FileNode和DirNode共有的方法


    var nodeMethod = {

        // 从父节点移除当前节点（注：节点的parent属性会被重置为null
        remove: function remove() {
            if (this.parent === null) throw new Error('Cannot remove the root node');
            return this.parent.removeChildren(this._id);
        },


        // 交换两个节点的位置，两个节点间不应该为父子关系
        swapWith: function swapWith(targetNode) {
            if (targetNode instanceof BaseNode === false) throw new Error();
            if (this.isParent(targetNode) || targetNode.isParent(this)) throw new Error('Cannot swap each other, beacuse they are parent-child relationship');

            var thisIdx = this._getIndex(),
                targetIdx = targetNode._getIndex(),
                thisParent = this.parent,
                targetParent = targetNode.parent;

            // 交换两个节点


            // 交换两个节点的parent属性指向
            var _ref = [targetNode, this];
            this.parent.children[thisIdx] = _ref[0];
            targetNode.parent.children[targetIdx] = _ref[1];
            var _ref2 = [targetParent, thisParent];
            this.parent = _ref2[0];
            targetNode.parent = _ref2[1];
        },
        _getIndex: function _getIndex() {
            if (this.parent == null || this.parent.children == null) return null;
            return this.parent.children.indexOf(this);
        }
    };

    Object.assign(DirNode.prototype, nodeMethod);
    Object.assign(FileNode.prototype, nodeMethod);

    var FileNodeView = function (_FileNode) {
        _inherits(FileNodeView, _FileNode);

        function FileNodeView(data, titleAttribute) {
            _classCallCheck(this, FileNodeView);

            var _this3 = _possibleConstructorReturn(this, (FileNodeView.__proto__ || Object.getPrototypeOf(FileNodeView)).call(this, data));

            _this3.titleAttribute = titleAttribute;

            var viewel = _this3._makeView();
            _this3.el = viewel.el;
            _this3.el_title = viewel.el_title;
            return _this3;
        }

        _createClass(FileNodeView, [{
            key: '_makeView',
            value: function _makeView() {
                var tfile = function tfile(id, name) {
                    return '\n            <div class="tree-file" data-id=' + help.escapeHTML(id) + '>\n                <div class="tree-element" draggable="true">\n                    <span class="title">' + help.escapeHTML(name) + '</span>\n                    <span class="rm-btn">\u5220\u9664</span>\n                    <span class="edit-btn">\u4FEE\u6539</span>\n                </div>\n            </div>';
                };

                var el = help.createElement(tfile(this._id, this._data[this.titleAttribute]));

                return {
                    el: el,
                    el_title: el.querySelector('.title')
                };
            }
        }]);

        return FileNodeView;
    }(FileNode);

    var DirNodeView = function (_DirNode) {
        _inherits(DirNodeView, _DirNode);

        function DirNodeView(data, titleAttribute) {
            _classCallCheck(this, DirNodeView);

            var _this4 = _possibleConstructorReturn(this, (DirNodeView.__proto__ || Object.getPrototypeOf(DirNodeView)).call(this, data));

            _this4.titleAttribute = titleAttribute;

            var viewel = _this4._makeView();
            _this4.el = viewel.el;
            _this4.el_title = viewel.el_title;

            return _this4;
        }

        _createClass(DirNodeView, [{
            key: '_makeView',
            value: function _makeView() {
                var tdir = function tdir(id, name) {
                    return '\n            <div class="tree-dir" data-id=' + help.escapeHTML(id) + '>\n                <div class="tree-element" draggable="true">\n                    <span class="title">' + help.escapeHTML(name) + '</span>\n                    <span class="rm-btn">\u5220\u9664</span>\n                    <span class="add-btn">\u6DFB\u52A0</span>\n                    <span class="edit-btn">\u4FEE\u6539</span>\n                </div>\n            </div>';
                };

                var el = help.createElement(tdir(this._id, this._data[this.titleAttribute]));
                return {
                    el: el,
                    el_title: el.querySelector('.title')
                };
            }
        }, {
            key: 'insert',
            value: function insert(node) {
                var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

                if (node instanceof FileNodeView === false && node instanceof DirNodeView === false) throw new Error();

                _get(DirNodeView.prototype.__proto__ || Object.getPrototypeOf(DirNodeView.prototype), 'insert', this).call(this, node, index);
                this.el.appendChild(node.el);

                return node;
            }
        }, {
            key: 'removeChildren',
            value: function removeChildren(id) {
                var rmnode = _get(DirNodeView.prototype.__proto__ || Object.getPrototypeOf(DirNodeView.prototype), 'removeChildren', this).call(this, id);
                rmnode.el.parentElement.removeChild(rmnode.el);
                return rmnode;
            }
        }, {
            key: 'insertBefore',
            value: function insertBefore(insertNode, refNode) {
                _get(DirNodeView.prototype.__proto__ || Object.getPrototypeOf(DirNodeView.prototype), 'insertBefore', this).call(this, insertNode, refNode);
                help.insertBefore(insertNode.el, refNode.el);
                return insertNode;
            }
        }, {
            key: 'insertAfter',
            value: function insertAfter(insertNode, refNode) {
                _get(DirNodeView.prototype.__proto__ || Object.getPrototypeOf(DirNodeView.prototype), 'insertAfter', this).call(this, insertNode, refNode);
                help.insertAfter(insertNode.el, refNode.el);
                return insertNode;
            }

            // 在根节点调用该函数，完成整个目录树的事件监听等任务

        }, {
            key: 'initRoot',
            value: function initRoot() {
                var _this5 = this;

                // 监听文件树中 删除/编辑/添加 按钮被点击的事件
                this.el.addEventListener('click', function (ev) {

                    var nodeel = ev.target.parentElement.parentElement;
                    var node = _this5.findNode(nodeel.getAttribute('data-id'));

                    if (ev.target.classList.contains('rm-btn')) {

                        // 向根节点触发remove事件，携带当前节点作为参数
                        _this5.trigger('remove', [node]);
                        ev.stopPropagation();
                    }
                    if (ev.target.classList.contains('edit-btn')) {

                        // 向根节点触发edit事件
                        _this5.trigger('edit', [node]);
                        ev.stopPropagation();
                    }
                    if (ev.target.classList.contains('add-btn')) {

                        // 向根节点触发insert事件
                        _this5.trigger('insert', [node]);
                        ev.stopPropagation();
                    }
                });

                // 监听文件树目录被点击的事件
                this.el.addEventListener('click', function (ev) {

                    var nodeel = ev.target.parentElement;
                    var node = _this5.findNode(nodeel.getAttribute('data-id'));

                    if (ev.target.classList.contains('tree-element') && ev.target.parentElement.classList.contains('tree-dir')) {

                        node.toggleExpand();
                        ev.stopPropagation();
                    }
                });

                // 监听拖拽事件
                this.el.addEventListener('dragstart', function (ev) {
                    if (ev.target.classList.contains('tree-element')) {
                        ev.dataTransfer.setData("text", ev.target.parentElement.getAttribute('data-id'));
                    }
                });
                this.el.addEventListener('dragover', function (ev) {
                    if (ev.target.classList.contains('tree-element')) {
                        ev.preventDefault();
                    }
                });
                this.el.addEventListener('dragenter', function (ev) {

                    // ie10/11 需要阻止dragenter的默认事件
                    if (ev.target.classList.contains('tree-element')) {
                        ev.preventDefault();
                    }
                });
                this.el.addEventListener('dragleave', function (ev) {
                    // 
                });
                this.el.addEventListener('drop', function (ev) {
                    if (ev.target.classList.contains('tree-element')) {
                        var dragNode = _this5.root.findNode(ev.dataTransfer.getData('text')),
                            targetNode = _this5.root.findNode(ev.target.parentElement.getAttribute('data-id'));

                        // 向根节点触发dropin事件
                        _this5.trigger('dropin', [dragNode, targetNode]);
                        ev.preventDefault();
                    }
                });

                // 移除根节点的删除按钮，因为根节点不应该被删除
                var treeElement = this.el.querySelector('.tree-element');
                treeElement.removeChild(treeElement.querySelector('.rm-btn'));
            }

            // 给当前节点的元素添加expanded类

        }, {
            key: 'expand',
            value: function expand() {
                this.el.classList.add('expanded');
            }

            // 给当前节点的元素移除expanded类

        }, {
            key: 'contract',
            value: function contract() {
                this.el.classList.remove('expanded');
            }

            // 给当前节点的元素切换expanded类

        }, {
            key: 'toggleExpand',
            value: function toggleExpand() {
                this.el.classList.toggle('expanded');
            }
        }], [{
            key: 'from',
            value: function from(treeobj, titleAttribute) {
                if ((typeof treeobj === 'undefined' ? 'undefined' : _typeof(treeobj)) !== 'object') throw new Error();
                if (treeobj.type !== 'dir') throw new Error();

                var tree = new DirNodeView(treeobj.data, titleAttribute);
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = treeobj.children[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var nodeobj = _step4.value;

                        if (nodeobj.type === 'file') {
                            tree.insert(new FileNodeView(nodeobj.data, titleAttribute));
                        } else if (nodeobj.type === 'dir') {
                            tree.insert(DirNodeView.from(nodeobj, titleAttribute));
                        } else {
                            throw new Error();
                        }
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }

                return tree;
            }
        }]);

        return DirNodeView;
    }(DirNode);

    // FileNodeView和DirNodeView共有的方法


    var nodeViewMethod = {
        swapWith: function swapWith(targetNode) {
            if (targetNode instanceof DirNodeView === false && targetNode instanceof FileNodeView === false) throw new Error();
            var _super = Object.getPrototypeOf(Object.getPrototypeOf(this));
            _super.swapWith.call(this, targetNode); // super(targetNode)
            help.swapElements(this.el, targetNode.el);
        },
        replaceNodeData: function replaceNodeData(data) {
            var _super = Object.getPrototypeOf(Object.getPrototypeOf(this));
            _super.replaceNodeData.call(this, data);
            this.el_title.innerText = this._data[this.titleAttribute];
        }
    };

    Object.assign(DirNodeView.prototype, nodeViewMethod);
    Object.assign(FileNodeView.prototype, nodeViewMethod);

    // 导出方法
    Object.assign(exports, {
        DirNode: DirNode,
        FileNode: FileNode,
        DirNodeView: DirNodeView,
        FileNodeView: FileNodeView
    });
})(window);
