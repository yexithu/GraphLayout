CCLayout = {
    MINLENGTH: 20,

    PADDING: 10,

    height: 0,

    width: 0,

    MARGIN: 0.025,

    setViewSize: function(w, h) {
        this.width = w;
        this.height = h;
    },

    apply: function(cc) {
        console.time('Calculate Static Layout');
        for (var i = 0; i < cc.length; ++i) {
            // this.calcStaticFDLayout(cc[i]);
            this.metricMDSLayout(cc[i]);
        }
        console.timeEnd('Calculate Static Layout');
        
        // console.time('Calculate Bounding Box');
        // for (var i = 0; i < cc.length; ++i) {
        //     this.calcBoudingBox(cc[i]);
        // }
        // cc.sort(this.graphSortFunction).reverse();
        // console.log(cc);
        // console.timeEnd('Calculate Bounding Box');

        // console.time('Calculate Grid Layout');
        // this.calcBoxesGridLayout(cc);
        // console.timeEnd('Calculate Grid Layout');
    },

    metricMDSLayout: function(graph) {
        var D = this.floydWarshall(graph);
    },

    randomInit: function(graph) {
        graph.nodes.map((node) => {
            node.x = (Math.random() - 0.5) * 4;
            node.y = (Math.random() - 0.5) * 4;
        });
    },

    calcStaticFDLayout:function(graph) {
        var simulation = d3.forceSimulation(graph.nodes)
            .force("link", d3.forceLink(graph.links).id(function (d) { return d.id; }))
            // .force("charge", d3.forceManyBody())
            // .force("radial", d3.forceRadial(30))
            .force("X", d3.forceX())
            .force("Y", d3.forceY())
            // .force("center", d3.forceCenter())
            .stop();
        //default
        simulation.alphaDecay(0.0014);
        // See https://github.com/d3/d3-force/blob/master/README.md#simulation_tick
        for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
            simulation.tick();
        }
        // for (var i = 0; i < 1200; ++i) {
        //     simulation.tick();
        // }
    },

    calcBoudingBox: function(graph) {
        var x, y;
        var w, h;
        var mx, my;

        var nodes = graph.nodes;
        x = nodes[0].x;
        mx = nodes[0].x;
        y = nodes[0].y;
        my = nodes[0].y;

        for (var i = 1; i < nodes.length; ++i) {
            x = Math.min(x, nodes[i].x);
            mx = Math.max(mx, nodes[i].x);
            y = Math.min(y, nodes[i].y);
            my = Math.max(my, nodes[i].y);
        }
        w = mx - x;
        h = my - y;
        // var margin = this.MARGIN;
        // console.log(margin);
        var box = {
            x: x,
            y: y,
            w: w,
            h: h
        };
        graph.box = box;
    },

    calcBoxesGridLayout: function(cc) {
        var boxes = cc.map((x) => {return x.box});
        var boxesArea = boxes.map((x)=>{return x.w * x.h});
        var sumArea = boxesArea.reduce((acc, cur) => {return acc + cur});        
        var viewArea = this.height * this.width;

        var scale = Math.sqrt(viewArea / sumArea);
        var scaledBoxes = boxes.map((b)=> {return {x:0, y:0, w:b.w * scale, h: b.h * scale}});
        
        var width = this.width,
            height = this.height,
            padding = this.PADDING;
        
        var top = 0;
        var left = 0;
        var rowRight = 0, 
            rowBot = 0,
            layoutRight = 0,
            layoutBot = 0;
        var i = 0;

        // top and left determine where to insert a new box
        while(true) {
            if (left <= width) {
                if (i === scaledBoxes.length) {
                    layoutRight = Math.max(layoutRight, rowRight);
                    layoutBot = Math.max(layoutBot,rowBot);
                    break;
                }
                
                var box = scaledBoxes[i];
                //same row, insert a box
                box.x = left;
                box.y = top;
                rowRight = left + box.w;
                rowBot = Math.max(rowBot, top + box.h);

                left = rowRight + padding;
                ++i;
            } else {                
                //To a new row
                layoutRight = Math.max(layoutRight, rowRight);
                layoutBot = Math.max(layoutBot,rowBot);

                left = 0;
                top = rowBot + padding;
                rowBot = 0;
                rowRight = 0;
                continue;
            }
        }

        var margin = this.MARGIN;
        // rearrange scaled boxes, first scale the center
        var layoutBox = {
            x: 0 - margin * layoutRight,
            y: 0 - margin * layoutBot,
            w: layoutRight + 2 * margin * layoutRight,
            h: layoutBot + 2 * margin * layoutBot
        };
        // console.log(layoutRight, layoutBot);
        // console.log(scaledBoxes);
        // console.log(layoutBox);
        var centeringFunc = this.getAlignFunction(layoutBox);
        scaledBoxes.map(centeringFunc);
        // console.log(scaledBoxes);
        for (var i = 0; i < scaledBoxes.length; ++i) {
            this.pointTransform(cc[i], scaledBoxes[i]);
        }
    },

    pointTransform: function(graph, dstBox) {
        var box = graph.box;
        var scale = dstBox.w / box.w;
        graph.dstBox = dstBox;
        graph.nodes.map(function(node) {
            node.x = (node.x - box.x) * scale + dstBox.x;
            node.y = (node.y - box.y) * scale + dstBox.y;
        });
    },

    graphSortFunction: function(a, b) {
        if (a.box.h === b.box.height) {
            return a.box.w - b.box.w;
        } else {
            return a.box.h - b.box.h;
        }
    },

    getAlignFunction: function(box) {
        var width = this.width,
            height = this.height;
        var scalew = width/ box.w,
            scaleh = height / box.h;
        
        var scale = Math.min(scalew, scaleh);
        var newW = box.w * scale,
            newH = box.h * scale;
        
        var offestX = 0.5 * width - (box.x + 0.5 * newW),
            offestY = 0.5 * height - (box.y + 0.5 * newH);

        var transformF = function(input) {
            input.x = box.x + (input.x - box.x) * scale + offestX;
            input.y = box.y + (input.y - box.y) * scale + offestY;
            input.w = input.w * scale;
            input.h = input.h * scale;
        };

        return transformF;
    },

    multiDijkstra: function(graph) {
        var nodes = graph.nodes,
            links = graph.links,
            n = graph.nodes.length,
            m = graph.links.length;
        
        var ID2Idx = {};
        var nbr = nodes.map((x) => []);

        for (var i = 0; i < n; ++i) {
            ID2Idx[nodes[i].id] = i;
        }

        for (var i = 0; i < m; ++i) {
            var srcIdx = ID2Idx[links[i].source];
            var dstIdx = ID2Idx[links[i].target];
            nbr[srcIdx].push(dstIdx);
            nbr[dstIdx].push(srcIdx);
        }
    
        var D = [];
        for (var i = 0; i < n; ++i) {     
            console.time('Running');   
            var Q = new FibonacciHeap();
            var leftCount = n;
            var distance = graph.nodes.map((x) => Infinity);
            distance[i] = 0;
            // for (var j = 0; j < i; ++j) {
            //     distance[j] = D[j][i];
            //     var nextNbr = nbr[j];
            //     for (var k = 0; k < nextNbr.length; ++k) {
            //         if (nextNbr[k] <i) {
            //             continue;
            //         }
            //         distance[nextNbr[k]] = Math.min(distance[j] + 1, distance[nextNbr[k]])
            //     }
            //     --leftCount;
            // }

            var fibNodes = [];
            for (var j = 0; j < n; ++j) {
                fibNodes.push(Q.insert(distance[j], graph.nodes[j]));
            }

            while(leftCount > 0) {
                var u = Q.extractMinimum();
                var nextNode = u.value;
                var nextIdx = ID2Idx[nextNode.id];
                // console.log(u.key, distance[nextIdx]);
                var nextNbr = nbr[nextIdx];
                for (var j = 0; j < nextNbr.length; ++j) {
                    if (distance[nextNbr[j]] > (distance[nextIdx]+ 1)) {
                        distance[nextNbr[j]] = distance[nextIdx]+ 1;
                        Q.decreaseKey(fibNodes[nextNbr[j]], distance[nextIdx]+ 1);
                    }
                }

                --leftCount;
            }
            D.push(distance);
            console.timeEnd('Running');   
        }
        return D;
    },

    floydWarshall: function(graph) {        
        var D = [];
        var adjMtx = [];
        var n = graph.nodes.length;
        var m = graph.links.length;
        console.log(graph.nodes.length);
        console.log(graph.links.length);

        for (var i = 0; i < n; ++i) {
            var row = [];
            for (var j = 0; j < n; ++j) {
                row.push(Infinity);
            }
            D.push(row);
        }
        
        var ID2Idx = {};
        for (var i = 0; i < n; ++i) {
            ID2Idx[graph.nodes[i].id] = i;
            D[i][i] = 0;
        }
    
        for (var i = 0; i < m; ++i) {
            var link = graph.links[i];
            var idx1 = ID2Idx[link.source],
                idx2 = ID2Idx[link.target];
            D[idx1][idx2] = 1;
            D[idx2][idx1] = 1;
        }
        
        adjMtx = D.map((x) => x.slice());

        var D_ = D.map((x) => x.slice());
        // console.log(adjMtx);        
        for (var k = 0; k < n; ++k) {
            console.time('Running');   
            for (var i = 0; i < n; ++i) {
                for (var j = 0; j < n; ++j) {
                        var entry = Math.min(D[i][j], D[i][k] + D[k][j]);
                        D_[i][j] = entry;
                }
            }
            var temp = D;
            D = D_;
            D_ = temp;
            console.timeEnd('Running');   
        }

        return D;
    },
};