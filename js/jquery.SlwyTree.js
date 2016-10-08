(function($) {
    $.fn.SlwyTree = function(setting, treeNodes) {
        var selector = {
            selectedTreeListEl: $('.slwyTree-selected-list'),
            selectedTreeCountEl: $('#selectedTreeCount')
        };

        function slwyTree(selector, setting, treeNodes) {
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
            this.setting = $.extend(setting, this.default);
            this.treeNodes = treeNodes;
            this.searchNodes = []; //搜索匹配节点,默认空
            this.searchFilter = [null, this.searchFilterHighlight, this.searchFilterShow]; //搜索Filter
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
                $(document).on('input', '#zTreeSearch', this.searchFilter[this.setting.searchType].bind(this));
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
            highlightNode: function(highlight) {
                var _self = this;
                this.searchNodes.forEach(function(node, i) {
                    node.highlight = highlight;
                    _self.ztreeObj.updateNode(node);
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
                    allNodes = this.ztreeObj.getNodes(), //所有节点
                    searchNodes = this.ztreeObj.getNodesByParamFuzzy('name', keyword);; //搜索匹配节点
                this.ztreeObj.hideNodes(allNodes);
                searchNodes.forEach(function(node, i) {
                    (function(searchNode) {
                        if (!searchNode) return false; //如果节点不存在，退出
                        var searchParentNode = searchNode.getParentNode(); //搜索匹配节点的父节点
                        arguments.callee.call(this, searchParentNode); //递归到根节点
                        if (!searchNode.isHidden) return false; //如果已经显示，退出
                        this.ztreeObj.showNode(searchNode); //显示当前节点
                        this.ztreeObj.hideNodes(searchNode.children) //并隐藏当前节点的子节点
                    }.bind(this))(node)
                }.bind(this));
            }
        }

        new slwyTree($(this), setting, treeNodes);
    };
})(jQuery);
