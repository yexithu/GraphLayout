CCCalculator = {
    divideGraph: function(graph) {
        var nodes = graph.nodes,
            links = graph.links;
        
        var nodeFlags = [],
            linkFlags = [];

        var ID2Idx = {};
        for (var i = 0; i < nodes.length; ++i) {
            nodeFlags.push(true);
            ID2Idx[nodes[i].id] = i;
        }
        
        var edges = nodes.map((x) => []);
        for (var i = 0; i < links.length; ++i) {
            linkFlags.push(true);
            var src = links[i].source;
            var dst = links[i].target;
            var srcIdx = ID2Idx[src];
            var dstIdx = ID2Idx[dst];

            edges[srcIdx].push({to: dstIdx, linkIdx: i});
            edges[dstIdx].push({to: srcIdx, linkIdx: i});
        }

        var DFS = function(nodeIdx, cNodes, cLinks) {
            cNodes.push(nodes[nodeIdx]);
            nodeFlags[nodeIdx] = false;

            var nodeEdges = edges[nodeIdx];
            for (var i = 0; i < nodeEdges.length; ++i) {
                var toIdx = nodeEdges[i].to,
                    linkIdx = nodeEdges[i].linkIdx;
                
                if (linkFlags[linkIdx]) {
                    cLinks.push(links[linkIdx]);
                    linkFlags[linkIdx] = false;
                }

                if (nodeFlags[toIdx]) {
                    DFS(toIdx, cNodes, cLinks);
                }
            }
        };

        var searchStart = 0,
            start = 0;
        
        var searchFirst = function() {
            for (i = searchStart; i < nodeFlags.length; ++i) {
                if (nodeFlags[i]) {
                    start = i;
                    return true;
                }
            }
            return false;
        }

        var cc = [];
        while(searchFirst()) {
            //DFS from start
            var subNodes = [],
                subLinks = [];
            DFS(start, subNodes, subLinks);
            cc.push(this.buildGraph(subNodes, subLinks));
            searchStart = start;
        }
        cc.sort(this.compareDegree).reverse();
        return cc;
    },

    calcCC: function(graph) {
        var nodes = graph.nodes;
        var links = graph.links;

        var idx2ID;

        var ccNodes = [];
        var ccLinks = [];

        var ID2Idx = {};
        var setIdx = [];
        for (var i = 0; i < nodes.length; ++i) {
            ccNodes.push([nodes[i]]);
            ccLinks.push([]);
            ID2Idx[nodes[i].id] = i;
            setIdx.push(i);
        }
        
        for (var i = 0; i < links.length; ++i) {
            var src = links[i].source;
            var dst = links[i].target;
            var srcIdx = ID2Idx[src];
            var dstIdx = ID2Idx[dst];

            var srcSet = setIdx[srcIdx];
            var dstSet = setIdx[dstIdx];
            // console.log(srcSet, dstSet);
            if (srcSet === dstSet) {
                //already in same set, do nothing
                ccLinks[srcSet].push(links[i]);
                continue;
            }
            var smaller = Math.min(srcSet, dstSet);
            var bigger = Math.max(srcSet, dstSet);
            
            for (var j = 0; j < ccNodes[bigger].length; ++j) {
                setIdx[ID2Idx[ccNodes[bigger][j]['id']]] = smaller;
            }
            ccNodes[smaller].push.apply(ccNodes[smaller], ccNodes[bigger]);
            ccNodes[bigger] = [];
            ccLinks[smaller].push(links[i]);
            ccLinks[smaller].push.apply(ccLinks[smaller], ccLinks[bigger]);
            // ccLinks[bigger].map((x) => {ccLinks[smaller].push(x)});
            ccLinks[bigger] = [];
        }

        var cc = [];
        for (var i = 0; i < ccNodes.length; ++i) {
            if(ccNodes[i].length == 0) {
                continue;
            } 
            cc.push(this.buildGraph(ccNodes[i], ccLinks[i]));
        }
        cc.sort(this.compareDegree).reverse();
        return cc;
    },

    calcStronglyCC: function(graph) {

    },

    buildGraph: function(nodes, links) {
        var g = {
                nodes: nodes,
                links: links
        };

        var degree = nodes.length;
        var numEdges = links.length;
        var weights = links.map((x) => {return x.value});
        var sumWeight = weights.reduce((a, b) => {return a + b});
        g.degree = degree;
        g.numEdges = numEdges;
        g.complexity = g.degree + g.numEdges;
        g.sumWeight = sumWeight;
        return g;
    },

    compareNumEdges: function(a, b) {
        if (a.numEdges === b.numEdges) {
            return a.degree - b.degree;
        } else {
            return a.numEdges - b.numEdges;
        }
    },

    compareDegree: function(a, b) {
        if (a.degree === b.degree) {
            return a.numEdges - b.numEdges;
        } else {
            return a.degree - b.degree;
        }
    },

    compareComplexity: function(a, b) {
        if (a.complexity === b.compareComplexity) {
            return a.degree - b.degree;
        } else {
            return a.complexity - b.complexity;
        }
    }
};