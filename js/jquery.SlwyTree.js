(function($) {
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
            this.init();
        }
        SlwyTree.prototype = {
            constructor: slwyTree,
            init: function() {
                this.render();
                this.initSelector();
                this.ztreeObj = $.fn.zTree.init($('#zTree'), this.setting, this.treeNodes);
                this.bind();
            },
            initSelector: function() {
                this.selectorEl = {
                    selectedNodeListEl: $('.slwyTree-selected-list'),
                    selectedTreeCountEl: $('#selectedTreeCount')
                };
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
                    if (node.checked) {
                        _self.selectedNodeList.push(node);
                    } else {
                        _self.selectedNodeList.splice(_self.selectedNodeList.indexOf(node), 1);
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
                    searchBoxDiv = $('<div class="search-box">');
                    searchBoxDiv.append('<i class="iconfont icon-search">&#xe60c;</i><input type="search" id="zTreeSearch" placeholder="搜索">');
                    zTreeDiv.before(searchBoxDiv);
                }
                if (this.setting.selectable) {
                    if (!this.setting.selectBoxEl) {
                        throw new Error('If you set selectable as true,you should pass parameter "selectBoxEl" as well.');
                    }
                    var html = [];
                    selectBoxDiv = $(this.setting.selectBoxEl);
                    html.push('<div class="slwyTree slwyTree-select">');
                    html.push('<div class="slwy-color-active slwyTree-title">已选:<span id="selectedTreeCount">0</span><a href="javascript:;" class="iconfont slwyTree-remove-all fr">&#xe60b;</a></div>');
                    html.push('<ul class="slwyTree-selected-list"></ul>');
                    html.push('</div>');

                    selectBoxDiv.append(html.join(''));
                }
                this.selector.html(slwyTreeDiv);
            },
            renderSelectedNodeList: function() {
                var html = '';
                for (var i = 0; i < this.selectedNodeList.length; i++) {
                    html += '<li data-tid="' + this.selectedNodeList[i].tId + '">' + this.selectedNodeList[i].name + '<a href="javascript:;" class="iconfont slwyTree-remove fr">&#xe60b;</a></li>';
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
                        if(!searchNode.open){
                            var parentNode=searchNode.getParentNode();
                            this.ztreeObj.expandNode(parentNode, true);
                        }
                    }.bind(this))(node)
                }.bind(this));
            }
        }

        return new SlwyTree($(this), setting, treeNodes);
    };
})(jQuery);
