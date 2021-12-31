(function(window, $, undefined) {
    'use strict';

    function OakTree(config){
        /*
         * Config needs...
         * _onClickEXP
         * _onClickOP
         * _onClickNode
         * Tree traget
         * Type target
         */
        var self = this;

        this.config = config;

        this.tree = {};

        this.nodeN = 0;

        this._arith_ops = ["+", "-", "X", "DIV", "SUMMATION", "FACTORIAL", "EXPONENT", "EQUALS", "LEQ", "LT"];
        this._logic_ops = ["TYPE", "DO", "EVAL", "CONS", "MEM1", "REM1", "AND", "OR", "NOT", "ATOM", "EQUALS", "PROG2", "WHILE", "IF-THEN", "IF-TH-ELSE", "FOR", "=", "Q", "ADL", "CHOP", "FNA", "NAME"];
        this._var_list = ["A", "B", "C", "D"];

        this._vars = {};
        this._ops = {
            "+": {sig: "xx", run: function(a){return parseInt(a[0]) + parseInt(a[1]);}},
            "-": {sig: "xx", run: function(a){return a[0] - a[1];}},
            "X": {sig: "xx", run: function(a){return a[0] * a[1];}},
            "DIV": {sig: "xx", run: function(a){return a[0] / a[1];}},
            "SUMMATION": {sig: "xx", run: function(a){}},
            "FACTORIAL": {sig: "x", run: function(a){}},
            "EXPONENT": {sig: "xx", run: function(a){return a[0] ** a[1];}},
            "EQUALS": {sig: "xx", run: function(a){return a[0] == a[1];}},
            "LEQ": {sig: "xx", run: function(a){return a[0] <= a[1];}},
            "LT": {sig: "xx", run: function(a){return a[0] < a[1];}},

            "TYPE": {sig: "x", run: function(a){self.type(a[0]);}},
            "DO": {sig: "x", run: function(a){}},
            "EVAL": {sig: "x", run: function(a){}}, //<-- This evaluates LISP-like expressions
            "CONS": {sig: "xx", run: function(a){return a;}}, //<-- Just like cons in LISP
            "MEM1": {sig: "l", run: function(a){return a[0][0];}},
            "REM1": {sig: "l", run: function(a){return a[0].slice(1);}},
            "AND": {sig: "xx", run: function(a){return a[0] && a[1];}},
            "OR": {sig: "xx", run: function(a){return a[0] || a[1];}},
            "NOT": {sig: "x", run: function(a){return !a[0];}},
            "ATOM": {sig: "x", run: function(a){return Array.isArray(a[0]);}},
            "PROG2": {sig: "xx", run: function(a){return a[1];}},
            "WHILE": {sig: "xx", flowControl: true, run: function(a){
                while(self.evaluate(a[0], self)){
                    self.evaluate(a[1], self);
                }
            }},
            "IF-THEN": {sig: "xx", flowControl: true, run: function(a, node){
                if(self.evaluate(a[0], self)){
                    self.evaluate(a[1], self);
                }
            }},
            "IF-TH-ELSE": {sig: "xxx", flowControl: true, run: function(a){
                if(self.evaluate(a[0], self)){
                    self.evaluate(a[1], self);
                }else{
                    self.evaluate(a[2], self);
                }
            }},
            "FOR": {sig: "vxxx", flowControl: true, run: function(a, node){
                for(self._vars[node.children[0].value] = self.evaluate(a[1], self); self._vars[node.children[0].value] <= self.evaluate(a[2], self); self._vars[node.children[0].value]++){
                    self.evaluate(a[3], self);
                }
            }},
            "=": {sig: "vx", run: function(a, node){self._vars[node.children[0].value] = a[1];}},
            "Q": {sig: "x", run: function(a){return String(a[0]);}},
            "ADL": {sig: "xx", run: function(a, node){
                if(node.children[1].value in self._vars && !Array.isArray(self._vars[node.children[1].value])){
                    self._vars[node.children[1].value] = [self._vars[node.children[1].value]];
                }else if(!(node.children[1].value in self._vars)){
                    self._vars[node.children[1].value] = [];
                }

                self._vars[node.children[1].value].push(a[0]);
            }},
            "CHOP": {sig: "l", run: function(a){return self._vars[node.children[0].value].pop();}},
            "FNA": {sig: "x", run: function(a){}},
            "NAME": {sig: "xx", run: function(a){return a[0];}},

            "NUMBER": {run: function(a, node){return node.value;}},
            "VARIABLE": {run: function(a, node){
                if(a.length == 1){
                    self._vars[node.value] = a[0];
                }

                return self._vars[node.value];
            }}
        };

        this._cleanNames = {
            "=": "EQUALS",
            "+": "PLUS"
        };

        return this;
    }

    OakTree.prototype.runTree = function(){
        return this.evaluate(this.tree.children[0], this);
    }

    OakTree.prototype.evaluate = function(node, self){
        var val = 0;

        if('children' in node && node.children.length > 0){
            if(self._ops[node.operation].flowControl){
                val = self._ops[node.operation].run(node.children, node);
            }else{
                val = self._ops[node.operation].run(node.children.map(function(n){
                    return self.evaluate(n, self);
                }), node);
            }
        }else if(node.operation == "VARIABLE"){
            val = self._ops[node.operation].run([], node);
        }else{
            val = node.value;
        }

        console.log(node.HTMLid + ": " + val);

        return val;
    }

    OakTree.prototype.type = function(s){
        $(this.config.typeContainer).append(s + "</br>");
    }

    OakTree.prototype.renderTree = function(){
        var self = this;
        this.tree = this.fixUpNode(this.tree);

        var chart = new Treant({
            chart: {
                container: this.config.treeContainer,
                connectors: {
                    type: "straight",
                    style: {
                        stroke: "white"
                    }
                },
                callback: {
                    onTreeLoaded: function(){
                        self.bindNode(self.tree);
                    }
                }
            },
            nodeStructure: this.tree
        });

        return chart;
    }

    OakTree.prototype.bindNode = function(node){
        var self = this;

        $("#" + node.HTMLid).on("click", function(){
            //$(".status > p").html(node.text.name);
            self.config._onClickNode(node);

            if('onClick' in node){
                node.onClick(node);
            }
        });

        if('children' in node){
            node.children.forEach(function(child){
                self.bindNode(child);
            });
        }
    }

    OakTree.prototype.removeNode = function(node, target){
        var self = this;

        if(node.HTMLid == target.HTMLid){
            return false;
        }

        if('children' in node){
            node.children = node.children.map(function(child){
                return self.removeNode(child, target);
            }).filter(function(child){
                return child;
            });
        }

         return node;
    }

    OakTree.prototype.replaceNode = function(node, targetName, newNode){
        var self = this;

        if(node.HTMLid == targetName){
            if('children' in node){
                newNode.children = node.children;
            }
            
            node = newNode;
        }

        if('children' in node){
            node.children = node.children.map(function(child){
                return self.replaceNode(child, targetName, newNode);
            });
        }

         return node;
    }

    OakTree.prototype.buildOpChildren = function(op){
        var self = this;

        return this._ops[op].sig.split("").map(function(arg){
            self.nodeN++;
            var node = {
                text: {name: "NUM-EXP"},
                operation: "TBD",
                HTMLid: "node-EXP-" + self.nodeN,
                onClick: self.config._onClickEXP
            };

            if(arg == "l"){
                node.text.name = "LIST";
            }else if(arg == "v"){
                node.text.name = "VARIABLE";
            }

            return node;
        });
    }

    OakTree.prototype.fixUpNode = function(node){
        var self = this;

        if(!('HTMLid' in node)){
            node.HTMLid = "node-" + this.cleanName(node.text.name);
        }
        
        if('operation' in node && !('onClick' in node)){
            node.onClick = this.config._onClickOP;
        }

        if(node.text.name == "EXP"){
            node.onClick = this.config._onClickEXP;
        }

        if('children' in node){
            node.children = node.children.map(function(child){
                return self.fixUpNode(child);
            });
        }

        return node;
    }

    OakTree.prototype.cleanName = function(name){
        if(name in this._cleanNames){
            return this._cleanNames[name];
        }else{
            return name;
        }
    }

    //Event handlers
    OakTree.prototype._onClickEXP = function(node){};
    OakTree.prototype._onClickOP = function(node){};

    window.OakTree = OakTree;
})(window, $, undefined);