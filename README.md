## 简介

一个简单的目录树组件，可以对目录树中的节点执行添加子节点、删除节点、编辑节点数据等操作，并可以通过拖拽节点的方式整理目录树结构。

目录树组件的作用是为保存类似目录树结构的数据提供的图形化操作界面，通过图形界面操作产生的数据能够保存为JSON，并可以通过保存的JSON创建图形界面。

目录树组件中包含目录节点和文件节点，两种节点都可以携带数据，但是目录节点可以拥有子节点，而文件节点为叶子节点。用法请看示例。


## 使用

EventEmitter为唯一依赖项，使用前请先引入[EventEmitter](https://github.com/Olical/EventEmitter)：

```html
<script src="https://cdn.bootcss.com/EventEmitter/5.2.2/EventEmitter.min.js"></script>
```

如果需要在IE10、IE11等较低版本浏览器中运行，还需要引入[babel-polyfill](http://babeljs.io/docs/usage/polyfill/)：

```html
<script src="https://cdn.bootcss.com/babel-polyfill/6.26.0/polyfill.min.js"></script>
```

引入`dest/sortable-tree.js`和`dest/sortable-tree.css`，CSS可以根据需要修改，DOM结构请自行研究。


### 示例

创建一颗文件树并将其插入到页面元素中，可以单击展开目录节点：
```html
<div id="itr"></div>

<script>
    var root    = new DirNodeView({title: 'baka'}, 'title');
    var subDir1 = root.insert(new DirNodeView({title: 'sub dir1'}, 'title'));
    var subDir2 = root.insert(new DirNodeView({title: 'sub dir2'}, 'title'));

    subDir1.insert(new FileNodeView({title: 'suika', description: 'suika baka'}, 'title'));
    subDir2.insert(new FileNodeView({title: 'suika', description: 'suika baka'}, 'title'));

    // 在根节点调用initRoot完成事件代理等工作
    root.initRoot();
    
    var itr = document.getElementById('itr');
    
    // 将根节点元素插入到文档树中
    itr.appendChild(root.el);
</script>
```

将创建的文件树串行化为可存储的字符串：
```js
var data = JSON.stringify(root);

// {"type":"dir","data":{"title":"baka"},"children":[{"type":"dir","data":{"title":"sub dir1"},"children":[{"type":"file","data":{"title":"suika","description":"suika baka"}}]},{"type":"dir","data":{"title":"sub dir2"},"children":[{"type":"file","data":{"title":"suika","description":"suika baka"}}]}]}
console.log(data);
```

使用串行化的数据创建文件树：
```html
<div id="itr"></div>

<script>
    var data = '{"type":"dir","data":{"title":"baka"},"children":[{"type":"dir","data":{"title":"sub dir1"},"children":[{"type":"file","data":{"title":"suika","description":"suika baka"}}]},{"type":"dir","data":{"title":"sub dir2"},"children":[{"type":"file","data":{"title":"suika","description":"suika baka"}}]}]}';

    var root = DirNodeView.from(JSON.parse(data), 'title');

    // 在根节点调用initRoot完成事件代理等工作
    root.initRoot();
    
    var itr = document.getElementById('itr');
    
    // 将根节点元素插入到文档树中
    itr.appendChild(root.el);
</script>
```

监听添加/删除/编辑/拖拽节点事件：
```js
root.on('insert', function(node) {
    node.insert(new DirNodeView({title: 'new dir node'}, 'title'));     // 插入节点
    node.expand();  // 展开节点
});

root.on('edit', function(node) {
    node.replaceNodeData({title: 'new data'});  // 替换节点数据
});

root.on('remove', function(node) {
    node.remove();  // 移除节点
});

root.on('dropin', function(dragNode, targetNode) {
    dragNode.swapWith(targetNode);  // 拖拽节点到另一个节点上时，交换两个节点位置

    // 另外两个可选的操作
    // targetNode.parent.insertBefore(dragNode, targetNode);  // 拖拽节点到另一个节点上时，将拖拽节点插入到目标节点之前
    // targetNode.parent.insertAfter(dragNode, targetNode);   // 拖拽节点到另一个节点上时，将拖拽节点插入到目标节点之后
});
```