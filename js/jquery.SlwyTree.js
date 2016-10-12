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
            this.default = {
                view: {
                    showLine: false,
                    showIcon: setting.showIcon === false ? false : true,
                    fontCss: function(treeId, treeNode) {
                        return (!!treeNode.highlight) ? { color: "#ff6706", "font-weight": "bold" } : { color: "#333", "font-weight": "normal" };
                    }
                },
                check: {
                    enable: setting.checkable || false,
                    chkboxType: { "Y": "", "N": "" }
                },
                callback: {

                },
                searchType: 1
            }
            this.selector = selector;
            this.setting = $.extend(this.default, setting);
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
                this.ztreeObj = $.fn.zTree.init($('#zTree'), this.setting, this.treeNodes);
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
                if (!this.setting.view.showIcon) {
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
                        _self.selectedNodeList.push(node);
                        _self.selectedNodeListEl.push(aEl);
                        _self.selectedListData.push(node.data);
                    } else {
                        var index = _self.selectedNodeList.indexOf(node); //匹配索引
                        _self.selectedNodeList.splice(index, 1);
                        _self.selectedNodeListEl.splice(index, 1);
                        _self.selectedListData.splice(index, 1);
                    }
                    _self.renderSelectedNodeList();
                    _self.updateSelectedTreeCount();
                }
                this.ztreeObj.setting.callback.onClick = function(e, id, node) {
                    var checked = !node.checked;
                    _self.ztreeObj.checkNode(node, checked, false, true);
                }
            },
            bindRemove: function() {
                if (!this.setting.selectable) {
                    return false;
                }
                var _self = this;
                $(document).on('click', '.slwyTree-remove', function(e) {
                    var tId = $(this).closest('li').data('tid'),
                        removeNode = _self.ztreeObj.getNodeByTId(tId);
                    _self.ztreeObj.checkNode(removeNode, false, false, true);
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
                    var aHtml = $('<li>').append(this.selectedNodeListEl[i].removeClass('curSelectedNode').clone()).html();
                    html += '<li data-tid="' + this.selectedNodeList[i].tId + '">' + aHtml + '<a href="javascript:;" class="slwyTree-remove fr">刪除</a></li>';
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
            }
        }

        return new SlwyTree($(this), setting, treeNodes);
    };
});
