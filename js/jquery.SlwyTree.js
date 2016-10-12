/**
 * Slwy树形jQuery插件
 * @author Joe.Wu
 * @version 开发阶段
 */
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        //AMD模式
        define(['jquery', 'zTree'], factory);
    } else {
        //全局模式
        factory(jQuery);
    }
})(function($, zTree) {
    $.fn.SlwyTree = function(setting, treeNodes) {

        function SlwyTree(selector, setting, treeNodes) {
            var defaults = {
                searchable: false, //是否可搜索,默认false
                searchType: 1, //1||2,搜索过滤方式,1搜索高亮显示,2搜索过滤显示,默认1
                checkable: false, //是否需要checkbox,默认false
                selectable: false, //是否可选择,默认false
                selectBoxEl: null, //选择列表容器，前提selectable为true
                selectContainChildren: true, //选择父级节点是否会连带选择所有子节点，默认true
                selectContainSelf: true, //设为false则当selectContainChildren为true时选择节点只会选择子节点而不会选择自身节点,默认为true
                selectOnlyChildren: false, //选择父级节点是否只选择最底层子节点，如果设为true，selectContainSelf无论是否设置都为false，前提selectContainChildren为true，默认false   
                fileIcon: null, //自定义文件图标（最底层没有子节点的节点图标）
                folderIcon: null, //自定义文件夹图标（收起）
                folderIconOpen: null, //自定义文件夹图标（展开）
                showIcon: true, //是否显示图标，默认为true,
                iconStyle: 'default', //图标风格，目前支持slwy和默认两种风格,
                iconSwitchStyle: 'default', //switch图标风格，目前支持arrow箭头和默认加减两种风格
                selectBoxTitleText: '已选择', //选择列表容器标题文案，默认为"已选择",
                selectBoxTitleSymbol: null, //选择列表容器已选择的数量单位，默认无
                searchBoxText: '搜索', //搜索框placeholder文案
            };
            this.selector = selector;
            this.setting = $.extend(defaults, setting);
            //如果父级节点只选择最底层子节点，selectContainSelf无论是否设置都为false
            this.setting.selectContainSelf = this.setting.selectOnlyChildren ? false : this.setting.selectContainSelf;
            this.zTreeSetting = {
                    view: {
                        showLine: false,
                        showIcon: this.setting.showIcon === false ? false : true,
                        fontCss: function(treeId, treeNode) {
                            return (!!treeNode.highlight) ? { color: "#ff6706", "font-weight": "bold" } : { color: "#333", "font-weight": "normal" };
                        }
                    },
                    check: {
                        enable: this.setting.checkable || false,
                        chkboxType: (function() {
                            if (this.setting.selectContainChildren) {
                                if (this.setting.selectContainSelf) {
                                    //checkbox勾选操作会影响子级节点
                                    return { "Y": "s", "N": "s" };
                                } else if(this.setting.selectOnlyChildren){
                                    //checkbox勾选操作会影响父子级节点
                                    return { "Y": "ps", "N": "ps" };
                                }else{
                                    //checkbox勾选操作会影响子级节点
                                    return { "Y": "s", "N": "s" };
                                }
                            } else {
                                //checkbox勾选操作不会影响其他节点
                                return { "Y": "", "N": "" };
                            }
                        }).call(this)
                    },
                    callback: {

                    }
                } //zTree基础设置
            this.treeNodes = treeNodes;
            this.searchNodes = []; //搜索匹配节点,默认空
            this.searchFilter = [null, this.searchFilterHighlight, this.searchFilterShow]; //搜索Filter
            this.selectedNodeList = []; //已选择的节点列表
            this.selectedNodeListEl = []; //已选择的节点元素
            this.selectedListData = []; //已选择的节点的绑定数据
            this.init();
        }
        SlwyTree.prototype = {
            constructor: SlwyTree,
            init: function() {
                this.render();
                this.initSelector();
                this.initTreeNodes();
                this.ztreeObj = $.fn.zTree.init($('#zTree'), this.zTreeSetting, this.treeNodes);
                this.bind();
            },
            initSelector: function() {
                this.selectorEl = {
                    selectedNodeListEl: $('.slwyTree-selected-list'),
                    selectedTreeCountEl: $('#selectedTreeCount')
                };
            },
            initTreeNodes: function() {
                //showIcon为false不用再设置自定义图标
                if (!this.setting.showIcon) {
                    return false;
                }

                if (typeof this.setting.fileIcon === "string") {
                    var fileIcon = this.setting.fileIcon; //自定义文件图标
                }

                if (typeof this.setting.folderIcon === "string" && typeof this.setting.folderIconOpen) {
                    var folderIcon = this.setting.folderIcon; //自定义文件夹（收起）图标
                    var folderIconOpen = this.setting.folderIconOpen; //自定义文件夹（展开）图标
                }

                //设置了自定义图标
                if (fileIcon || folderIcon && folderIconOpen) {
                    //遍历到没有子节点的底层并加上自定义图标
                    (function(treeNodes) {
                        for (var i = 0; i < treeNodes.length; i++) {
                            if (treeNodes[i].children) {
                                arguments.callee.call(this, treeNodes[i].children)

                                //设置自定义文件夹图标（收起与展开）
                                if (folderIcon && folderIconOpen) {
                                    treeNodes[i].iconClose = folderIcon;
                                    treeNodes[i].iconOpen = folderIconOpen;
                                }
                                continue;
                            }
                            //设置了自定义文件图标
                            if (fileIcon) {
                                treeNodes[i].icon = fileIcon;
                            }
                        }
                    })(treeNodes)
                }

            },
            bind: function() {
                this.bindSearch();
                this.bindCheck();
                this.bindRemove();
            },
            bindSearch: function() {
                if (!this.setting.searchable) {
                    return false;
                }
                var _self = this;
                $(document).on('input', '#zTreeSearch', this.searchFilter[this.setting.searchType].bind(this));
            },
            bindCheck: function() {
                if (!this.setting.checkable) {
                    return false;
                }
                var _self = this;
                this.ztreeObj.setting.callback.onCheck = function(e, id, node) {
                    // e.stopPropagation();
                    var el = $(event.target),
                        aEl = el.closest('li').find('>a');
                    if (node.checked) {
                        //选择包含所有子节点
                        if (_self.setting.selectContainChildren) {
                            var allChildrenNodes;
                            //如果设置为选择时不包含自身节点并且不是只包含最底层子节点，自身checked置为false
                            if (!_self.setting.selectContainSelf && !_self.setting.selectOnlyChildren) {
                                _self.ztreeObj.checkNode(node, false, false, false);
                            }

                            //获取所有最底层的子节点

                            allChildrenNodes = _self.getAllChildrenNodes(node, _self.setting.selectContainSelf, _self.setting.selectOnlyChildren);


                            $.each(allChildrenNodes, function(i, node) {
                                if (_self.selectedNodeList.indexOf(node) < 0) {
                                    _self.selectedNodeList.push(node);
                                }

                                //如果设置为选择时不包含自身节点并且不是只包含最底层子节点，手动将所有子节点checked置为true
                                if (!_self.setting.selectContainSelff && !_self.setting.selectOnlyChildren) {
                                    _self.ztreeObj.checkNode(node, true, false, false);
                                }
                            })


                        } else {
                            _self.selectedNodeList.push(node);
                            _self.selectedNodeListEl.push(aEl);
                            _self.selectedListData.push(node.data);
                        }
                    } else {
                        if (_self.setting.selectContainChildren) {
                            //获取所有最底层的子节点
                            var allChildrenNodes = _self.getAllChildrenNodes(node, true, _self.setting.selectOnlyChildren);
                            $.each(allChildrenNodes, function(i, node) {
                                var index = _self.selectedNodeList.indexOf(node); //匹配索引
                                if (index >= 0) {
                                    _self.selectedNodeList.splice(index, 1);
                                }
                            })
                        } else {
                            var index = _self.selectedNodeList.indexOf(node); //匹配索引
                            if (index >= 0) {
                                _self.selectedNodeList.splice(index, 1);
                                _self.selectedNodeListEl.splice(index, 1);
                                _self.selectedListData.splice(index, 1);
                            }
                        }

                    }
                    _self.renderSelectedNodeList();
                    _self.updateSelectedTreeCount();
                }
                this.ztreeObj.setting.callback.onClick = function(e, id, node) {
                    var checked = !node.checked,
                        isAffect = _self.setting.selectContainChildren;

                    _self.ztreeObj.checkNode(node, checked, isAffect, true);
                }
            },
            bindRemove: function() {
                if (!this.setting.selectable) {
                    return false;
                }
                var _self = this;
                $(document).on('click', '.slwyTree-remove', function(e) {
                    var tId = $(this).closest('li').data('tid'),
                        removeNode = _self.ztreeObj.getNodeByTId(tId),
                        isAffect = _self.setting.selectContainChildren;
                    _self.ztreeObj.checkNode(removeNode, false, isAffect, true);
                })
                $(document).on('click', '.slwyTree-remove-all', function(e) {
                    _self.ztreeObj.checkAllNodes(false);
                    _self.selectedNodeList = [];
                    _self.selectedNodeListEl = [];
                    _self.selectorEl.selectedNodeListEl.html('');
                    _self.selectorEl.selectedTreeCountEl.text(0);
                })
            },
            render: function() {
                var slwyTreeDiv = $('<div class="slwyTree">'),
                    zTreeDiv = $('<div class="ztree" id="zTree">'),
                    selectBoxDiv,
                    searchBoxDiv,
                    searchBoxIcon,
                    searchBoxInput,
                    html;
                //设置了图标风格
                if (this.setting.iconStyle == "slwy") {
                    slwyTreeDiv.addClass('slwy-style');
                }
                //设置了switch图标风格
                if (this.setting.iconSwitchStyle == "arrow") {
                    slwyTreeDiv.addClass('slwy-switch-arrow')
                }
                slwyTreeDiv.append(zTreeDiv);
                if (this.setting.searchable) {
                    searchBoxDiv = $('<div class="slwyTree-searchbox">');
                    searchBoxIcon = $('<i class="slwyTree-searchbox-icon">');
                    searchBoxInput = $('<input type="search" id="zTreeSearch">');
                    searchBoxInput.attr('placeholder', this.setting.searchBoxText);
                    searchBoxDiv.append(searchBoxIcon);
                    searchBoxDiv.append(searchBoxInput);
                    zTreeDiv.before(searchBoxDiv);
                }
                if (this.setting.selectable) {
                    if (!this.setting.selectBoxEl) {
                        throw new Error('If you set selectable as true,you should pass parameter "selectBoxEl" as well.');
                    }
                    html = [];
                    selectBoxDiv = $(this.setting.selectBoxEl);
                    html.push('<div class="slwyTree ');
                    //设置了图标风格
                    if (this.setting.iconStyle == "slwy") {
                        html.push('slwy-style');
                    }
                    //设置了switch图标风格
                    if (this.setting.iconSwitchStyle == "arrow") {
                        html.push('slwy-switch-arrow')
                    }
                    html.push('">');
                    html.push('<div class="slwyTree-selectBox">');
                    html.push('<div class="slwyTree-title">');
                    html.push(this.setting.selectBoxTitleText || '');
                    html.push('（');
                    html.push('<span id="selectedTreeCount">0</span>');
                    html.push(this.setting.selectBoxTitleSymbol || '');
                    html.push('）');
                    html.push('<a href="javascript:;" class="slwyTree-remove-all fr">全部删除</a>');
                    html.push('</div>');
                    html.push('<div class="ztree">');
                    html.push('<ul class="slwyTree-selected-list"></ul>');
                    html.push('</div>');
                    html.push('</div>');

                    selectBoxDiv.css({ 'overflow': 'auto', 'height': '100%' }).append(html.join(''));
                }
                this.selector.html(slwyTreeDiv);
            },
            renderSelectedNodeList: function() {
                var html = '';
                for (var i = 0; i < this.selectedNodeList.length; i++) {
                    var thisNode = this.selectedNodeList[i],
                        li = $('<li>').attr('data-tid', thisNode.tId),
                        a = $('<a id="' + thisNode.tId + '_a" treenode_a>'),
                        icoSpan = $('<span id="' + thisNode.tId + '_ico" treenode_ico class="button">'),
                        nameSpan = $('<span id="' + thisNode.tId + '_span" class="node_name">').text(thisNode.name),
                        removeA = $('<a href="javascript:;" class="slwyTree-remove fr">').text('删除');

                    if (thisNode.children) {
                        icoSpan.addClass('ico_open');
                    } else {
                        icoSpan.addClass('ico_docu');
                    }

                    html += li.html(a.append(icoSpan).append(nameSpan).append(removeA))[0].outerHTML;
                }
                this.selectorEl.selectedNodeListEl.html(html);
            },
            updateSelectedTreeCount: function() {
                this.selectorEl.selectedTreeCountEl.text(this.selectedNodeList.length);
            },
            highlightNode: function(highlight) {
                var _self = this;
                $.each(this.searchNodes, function(i, node) {
                    node.highlight = highlight;
                    _self.ztreeObj.updateNode(node);

                    //如果该节点的父节点没展开则展开
                    if (!node.open) {
                        var parentNode = node.getParentNode();
                        _self.ztreeObj.expandNode(parentNode, true);
                    }
                })
            },
            //匹配结果高亮搜索过滤
            searchFilterHighlight: function(event) {
                var keyword = $.trim(event.target.value);

                this.highlightNode(false);
                if (!keyword) return false;
                this.searchNodes = this.ztreeObj.getNodesByParamFuzzy('name', keyword); //搜索匹配节点
                console.log(this.searchNodes);
                this.highlightNode(true);
            },
            //显示隐藏搜索过滤
            searchFilterShow: function(event) {
                var keyword = $.trim(event.target.value),
                    allNodes = this.ztreeObj.getNodes(); //所有节点
                this.searchNodes = this.ztreeObj.getNodesByParamFuzzy('name', keyword);; //搜索匹配节点
                this.ztreeObj.hideNodes(allNodes);
                $.each(this.searchNodes, function(i, node) {
                    (function(searchNode) {
                        if (!searchNode) return false; //如果节点不存在，退出
                        var searchParentNode = searchNode.getParentNode(); //搜索匹配节点的父节点
                        arguments.callee.call(this, searchParentNode); //递归到根节点
                        if (!searchNode.isHidden) return false; //如果已经显示，退出
                        this.ztreeObj.showNode(searchNode); //显示当前节点
                        this.ztreeObj.hideNodes(searchNode.children) //并隐藏当前节点的子节点

                        //如果该节点的父节点没展开则展开
                        if (!searchNode.open) {
                            var parentNode = searchNode.getParentNode();
                            this.ztreeObj.expandNode(parentNode, true);
                        }
                    }.bind(this))(node)
                }.bind(this));
            },
            //获取所有子节点
            getAllChildrenNodes: function(node, isContainSelf, isOnlyChild) {
                var children = [];
                isContainSelf = isContainSelf || false; //是否包含自己
                isOnlyChild = isOnlyChild || false; //是否只包含最底层的子节点
                (function(thisNode) {
                    if (!thisNode.children) {
                        children.push(thisNode);
                        return false;
                    }
                    if (thisNode.children.length) {
                        for (var i = 0; i < thisNode.children.length; i++) {
                            arguments.callee.call(this, thisNode.children[i]);
                        }

                        //是否只包含最底层的子节点
                        if (isOnlyChild) {
                            if (!thisNode.children) {
                                children.push(thisNode);
                            }
                            //是否包含自己
                            if (isContainSelf) {
                                if (thisNode == node) {
                                    children.push(thisNode);
                                }
                            }
                        } else {
                            //是否包含自己
                            if (isContainSelf) {
                                children.push(thisNode);
                            } else {
                                if (thisNode != node) {
                                    children.push(thisNode);
                                }
                            }
                        }
                    }
                })(node);
                return children;
            }
        }


        return new SlwyTree($(this), setting, treeNodes);
    };
});
