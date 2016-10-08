(function($) {
    $.fn.SlwyTree = function(setting, treeNodes) {
        var selector = {
            selectedTreeListEl: $('.slwyTree-selected-list'),
            selectedTreeCountEl: $('#selectedTreeCount')
        };

        function slwyTree(selector, setting, treeNodes) {
            this.default = {
                view: {
                    showLine: false
                },
                check: {
                    enable: setting.checkable || false,
                    chkboxType: { "Y": "", "N": "" }
                },
                callback: {

                }
            }
            this.selector = selector;
            this.setting = $.extend(setting, this.default);
            this.treeNodes = treeNodes;
            this.init();
        }
        slwyTree.prototype = {
            constructor: slwyTree,
            init: function() {
                this.ztreeObj = $.fn.zTree.init(this.selector, this.setting, this.treeNodes);
                this.selectedTreeList = [];
                this.bind();
            },
            bind: function() {
                if (this.setting.searchable) this.bindSearch();
                if (this.setting.checkable) this.bindCheck();
                this.bindRemove();
            },
            bindSearch: function() {
                var _self = this;
                $(document).on('input', '#zTreeSearch', this.searchFilter)
            },
            bindCheck: function() {
                var _self = this;
                this.ztreeObj.setting.callback.onCheck = function(e, id, node) {
                    if (node.checked) {
                        _self.selectedTreeList.push(node);
                    } else {
                        _self.selectedTreeList.splice(_self.selectedTreeList.indexOf(node), 1);
                    }
                    _self.renderSelectedTreeList();
                    _self.updateSelectedTreeCount();
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
                    _self.selectedTreeList = [];
                    selector.selectedTreeListEl.html('');
                    selector.selectedTreeCountEl.text(0);
                })
            },
            renderSelectedTreeList: function() {
                var html = '';
                for (var i = 0; i < this.selectedTreeList.length; i++) {
                    html += '<li data-tid="' + this.selectedTreeList[i].tId + '">' + this.selectedTreeList[i].name + '<a href="javascript:;" class="iconfont slwyTree-remove fr">&#xe60b;</a></li>';
                }
                selector.selectedTreeListEl.html(html);
            },
            updateSelectedTreeCount: function() {
                selector.selectedTreeCountEl.text(this.selectedTreeList.length);
            },
            //显示隐藏搜索过滤
            /*searchFilter: function(event) {
                var keyword = $(this).val(),
                    allNodes = _self.ztreeObj.getNodes(), //所有节点
                    searchNodes = _self.ztreeObj.getNodesByParamFuzzy('name', keyword);; //搜索匹配节点

                _self.ztreeObj.hideNodes(allNodes);
                searchNodes.forEach(function(node, i) {
                    (function(searchNode) {
                        if (!searchNode) return false; //如果节点不存在，退出
                        var searchParentNode = searchNode.getParentNode(); //搜索匹配节点的父节点
                        arguments.callee.call(this, searchParentNode); //递归到根节点
                        if (!searchNode.isHidden) return false; //如果已经显示，退出
                        _self.ztreeObj.showNode(searchNode); //显示当前节点
                        _self.ztreeObj.hideNodes(searchNode.children) //并隐藏当前节点的子节点
                    })(node)

                });

            },*/
            //匹配结果标红搜索过滤
            searchFilter: function(event) {
                var keyword = $(this).val(),
                    allNodes = _self.ztreeObj.getNodes(), //所有节点
                    searchNodes = _self.ztreeObj.getNodesByParamFuzzy('name', keyword);; //搜索匹配节点

                // _self.ztreeObj.hideNodes(allNodes);
                console.log('ddddddddddd')
                console.log(searchNodes);
                searchNodes.forEach(function(node, i) {
                    (function(searchNode) {
                        if (!searchNode) return false; //如果节点不存在，退出
                        var searchParentNode = searchNode.getParentNode(); //搜索匹配节点的父节点
                        arguments.callee.call(this, searchParentNode); //递归到根节点
                        if (!searchNode.isHidden) return false; //如果已经显示，退出
                        _self.ztreeObj.showNode(searchNode); //显示当前节点
                        _self.ztreeObj.hideNodes(searchNode.children) //并隐藏当前节点的子节点
                    })(node)

                });

            }
        }

        new slwyTree($(this), setting, treeNodes);
    };
})(jQuery);
