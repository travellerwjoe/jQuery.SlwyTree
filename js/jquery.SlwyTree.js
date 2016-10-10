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
                    fontCss: function(treeId, treeNode) {
                        return (!!treeNode.highlight) ? { color: "#A60000", "font-weight": "bold" } : { color: "#333", "font-weight": "normal" };
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
            this.init();
        }
        SlwyTree.prototype = {
            constructor: slwyTree,
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
                if (this.setting.searchable) this.bindSearch();
                if (this.setting.checkable) this.bindCheck();
                this.bindRemove();
            },
            bindSearch: function() {
                var _self = this;
                $(document).on('input', '#zTreeSearch', this.searchFilter[this.setting.searchType].bind(this));
            },
            bindCheck: function() {
                var _self = this;
                this.ztreeObj.setting.callback.onCheck = function(e, id, node) {
                    // e.stopPropagation();
                    var el = $(event.target),
                        aEl = el.closest('li').find('a');
                    if (node.checked) {
                        _self.selectedNodeList.push(node);
                        _self.selectedNodeListEl.push(aEl);
                    } else {
                        _self.selectedNodeList.splice(_self.selectedNodeList.indexOf(node), 1);
                        _self.selectedNodeListEl.splice(_self.selectedNodeListEl.indexOf(aEl), 1);
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
                var _self = this;
                $(document).on('click', '.slwyTree-remove', function(e) {
                    var tId = $(this).closest('li').data('tid'),
                        removeNode = _self.ztreeObj.getNodeByTId(tId);
                    _self.ztreeObj.checkNode(removeNode, false, false, true);
                })
                $(document).on('click', '.slwyTree-remove-all', function(e) {
                    _self.ztreeObj.checkAllNodes(false);
                    _self.selectedNodeList = [];
                    _self.selectorEl.selectedNodeListEl.html('');
                    _self.selectorEl.selectedTreeCountEl.text(0);
                })
            },
            render: function() {
                var slwyTreeDiv = $('<div class="slwyTree slwyTree-select">'),
                    zTreeDiv = $('<div class="ztree" id="zTree"></div>'),
                    searchBoxDiv,
                    selectBoxDiv;
                slwyTreeDiv.append(zTreeDiv);
                if (this.setting.searchable) {
                    searchBoxDiv = $('<div class="slwyTree-searchbox">');
                    searchBoxDiv.append('<i class="icon-search"><svg width="100%" height="100%" viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g class="transform-group"><g transform="scale(0.2, 0.2)"><path d="M936.4725 824.3641 737.6731 620.871c-1.9468-1.9986-4.4322-2.8631-6.5948-4.5379 41.6635-58.6832 66.3567-130.2237 66.3567-207.7082 0-198.5754-161.0274-359.6512-359.6659-359.6512-198.6355 0-359.6659 161.0758-359.6659 359.6512 0 198.6303 161.0304 359.6502 359.6659 359.6502 82.1377 0 157.5716-27.7722 218.0921-74.1317 1.0803 1.2941 1.511 2.8631 2.6473 4.0503l198.7974 203.546c10.8071 11.0785 25.184 16.6427 39.5568 16.6427 13.9401 0 27.9372-5.2404 38.6884-15.7783C957.3861 881.3155 957.8169 846.2482 936.4725 824.3641zM133.438 408.625c0-167.7742 136.552-304.3197 304.3321-304.3197 167.8371 0 304.3321 136.5464 304.3321 304.3197 0 167.8312-136.4951 304.3207-304.3321 304.3207C269.99 712.9456 133.438 576.4562 133.438 408.625z" fill="#aaa"></path></g></g></svg></i>');
                    searchBoxDiv.append('<input type="search" id="zTreeSearch" placeholder="搜索">');
                    zTreeDiv.before(searchBoxDiv);
                }
                if (this.setting.selectable) {
                    if (!this.setting.selectBoxEl) {
                        throw new Error('If you set selectable as true,you should pass parameter "selectBoxEl" as well.');
                    }
                    var html = [];
                    selectBoxDiv = $(this.setting.selectBoxEl);
                    html.push('<div class="slwyTree slwyTree-select ztree">');
                    html.push('<div class="slwy-color-active slwyTree-title">已选:<span id="selectedTreeCount">0</span><a href="javascript:;" class="slwyTree-remove-all fr">刪除全部</a></div>');
                    html.push('<ul class="slwyTree-selected-list"></ul>');
                    html.push('</div>');

                    selectBoxDiv.append(html.join(''));
                }
                this.selector.html(slwyTreeDiv);
            },
            renderSelectedNodeList: function() {

                var html = '';
                for (var i = 0; i < this.selectedNodeList.length; i++) {
                    var aHtml=$('<li>').append(this.selectedNodeListEl[i].removeClass('curSelectedNode').clone()).html();
                    html += '<li data-tid="' + this.selectedNodeList[i].tId + '">'+ aHtml + '<a href="javascript:;" class="slwyTree-remove fr">刪除</a></li>';
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
