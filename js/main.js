var svg = d3.select("svg");

var width = $('svg').width(),
    height = $('svg').height();

var CIRCLERADIUS = 3;

var ActivedGraph = null;
var ActivedGraphNode = null;

var PlainColor = "#404040";
var SelectedColor = "red";
var FirstDegreeColor = "#A1A1FF";
var SecondDegreeColor = "#2424FF";


d3.json("/data/big.json", function (error, graph) {    
    if (error) throw error;
    
    console.time('Calculate Connected Components');
    components = CCCalculator.divideGraph(graph);
    console.timeEnd('Calculate Connected Components');
    // components = components.slice(1, 2);
    // fibheapTest(components);
    // dynamicRender(components);
    // dynamicStressMinimization(components);
    CCLayout.setViewSize(width, height);
    CCLayout.apply(components);

    renderCC(components);
});

function fibheapTest(cc) {
    var graph = cc[0];
    console.log(graph.nodes.length);
    console.log(graph.links.length);
    console.time('floyd');
    var D1 = CCLayout.floydWarshall(graph);
    console.log(D1);
    console.timeEnd('floyd');

    console.time('dijkstra');
    var D2 = CCLayout.multiDijkstra(graph);
    console.log(D2);
    console.timeEnd('dijkstra');

    for (var i = 0; i < D1.length; ++i) {
        var row1 = D1[i];
        var row2 = D2[i];
        for (var j = 0; j < row1.length; ++j) {
            if (row1[j] !== row2[j]) {
                alert('Badly Wrong');
                throw('Badly wrong!');
            }
        }
    }
    console.log('Quite good');
}
function dynamicStressMinimizationVectorious(cc) {
    var graph = cc[0];
    var n = graph.nodes.length;
    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke-width", function (d) { return Math.sqrt(d.value); });

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("stoke-width", 0);

    node.append("title")
        .text(function (d) { return d.id; });
    
    // graph.nodes.map((x) => {x.x = 0});
    // ticked();
    console.time('Dijkstra');
    var D = CCLayout.multiDijkstra(graph);
    console.timeEnd('Dijkstra');

    var W = numeric.pow(D, -2);
    for (var i = 0; i < n; ++i) {
        W[i][i] = 0;
    }
    CCLayout.randomInit(graph);    

    var simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(function (d) { return d.id; }))
        // .force("charge", d3.forceManyBody())
        // .force("center", d3.forceCenter())
        .stop();

    var scale = 50;
    var offesetX = width / 2;
    var offesetY = height / 2;
    var iteration = 1;
    console.log('start rendering');

    //2 * n
    var X;
    var X_;    
    var rowX;
    var rowY;
    var matX;
    var matX_;
    var matY;
    var matY_;
    var S;
    var ones = numeric.rep([n], 1);

    X = numeric.rep([2, n], 0);
    for (var i = 0; i < n; ++i) {
        X[0][i] = graph.nodes[i].x;
        X[1][i] = graph.nodes[i].y;
    }    
    X_ = numeric.transpose(X);

    console.time('updating');
    for (var i = 0; i < 300; ++i) {
        ticked();
    }
    console.timeEnd('updating');

    function ticked() {
        S = numeric.muleq(numeric.dot(X_, X), -2);
        rowX = X[0];
        rowY = X[1];
        matX = numeric.poweq(numeric.tensor(ones, rowX), 2);
        matX_ = numeric.transpose(matX);
        matY = numeric.pow(numeric.tensor(ones, rowY), 2);
        matY_ = numeric.transpose(matY);
        numeric.addeq(S, matX);
        numeric.addeq(S, matX_);
        numeric.addeq(S, matY);
        numeric.addeq(S, matY_);
        numeric.sqrteq(S);
        
        for (var i = 0; i < n; ++i) {
            S[i][i] = Infinity;
        }

        S = numeric.div(1, S);
        numeric.muleq(S, D);
    }
}
function dynamicStressMinimization(cc) {
    var graph = cc[0];

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke-width", function (d) { return Math.sqrt(d.value); });

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 5);

    node.append("title")
        .text(function (d) { return d.id; });
    
    // graph.nodes.map((x) => {x.x = 0});
    // ticked();
    console.time('Dijkstra');
    var D = CCLayout.multiDijkstra(graph);
    console.timeEnd('Dijkstra');

    var W = D.map((x) => (x.map((y) => 1 / (y * y))));
    CCLayout.randomInit(graph);    

    var simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(function (d) { return d.id; }))
        // .force("charge", d3.forceManyBody())
        // .force("center", d3.forceCenter())
        .stop();

    var scale = 50;
    var offesetX = width / 2;
    var offesetY = height / 2;
    var iteration = 1;
    console.log('start rendering');

    console.time('updating');
    for (var i = 0; i < 300; ++i) {
        ticked();
    }
    console.timeEnd('updating');
    
    function ticked() {

        var numx = 0,
            numy = 0,
            den = 0,
            edij = 0,
            sij = 0,
            nodeix = 0,
            nodeiy = 0,
            nodejx = 0,
            nodejy = 0,
            wij = 0;

        for (var i = 0; i < graph.nodes.length; ++i) {
            numx = 0;
            numy = 0;
            den = 0;
            nodeix = graph.nodes[i].x;
            nodeiy = graph.nodes[i].y;
            for (var j = 0; j < graph.nodes.length; ++j) {
                if (i == j) {
                    continue;
                }
                wij = W[i][j];
                nodejx = graph.nodes[j].x;
                nodejy = graph.nodes[j].y;

                edij = Math.sqrt((nodeix - nodejx) * (nodeix - nodejx) + 
                    (nodeiy - nodejy) * (nodeiy - nodejy));
                sij = D[i][j] / edij;

                numx += wij * (nodejx + sij * (nodeix - nodejx));
                numy += wij * (nodejy + sij * (nodeiy - nodejy));
                den += wij;
            }
            graph.nodes[i].x = (numx / den);
            graph.nodes[i].y = (numy / den);
        }
    }
    link
        .attr("x1", function (d) { return d.source.x * scale + offesetX; })
        .attr("y1", function (d) { return d.source.y * scale + offesetY; })
        .attr("x2", function (d) { return d.target.x * scale + offesetX; })
        .attr("y2", function (d) { return d.target.y * scale + offesetY; });

    node
        .attr("cx", function (d) { return d.x * scale + offesetX; })
        .attr("cy", function (d) { return d.y * scale + offesetY; });
}

function dynamicRender(cc) {
    var simulations = [];

    cc.forEach(function (element) {

        var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(element.links)
            .enter().append("line")
            .attr("stroke-width", function (d) { return Math.sqrt(d.value); });

        var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(element.nodes)
            .enter().append("circle")
            .attr("r", CIRCLERADIUS)

        var simulation = d3.forceSimulation(element.nodes)
            .force("link", d3.forceLink(element.links).id(function (d) { return d.id; }))
            .force("charge", d3.forceManyBody().strength(-20))
            .force("center", d3.forceCenter());
        // .stop();

        simulation
            .on("tick", ticked);

        node.append("title")
            .text(function (d) { return d.id; });

        var scale = 0.4;
        var offesetX = width / 2;
        var offesetY = height / 2;
        function ticked() {
            link
                .attr("x1", function (d) { return d.source.x * scale + offesetX; })
                .attr("y1", function (d) { return d.source.y * scale + offesetY; })
                .attr("x2", function (d) { return d.target.x * scale + offesetX; })
                .attr("y2", function (d) { return d.target.y * scale + offesetY; });

            node
                .attr("cx", function (d) { return d.x * scale + offesetX; })
                .attr("cy", function (d) { return d.y * scale + offesetY; });
        }
    });
}

function renderCC(cc) {
    svg.on("click", svgClicked);
    cc.forEach(function (graph) {
        enhanceGraph(graph);

        var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr("stroke-width", function (d) { return Math.sqrt(d.value); });

        var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.nodes)
            .enter().append("circle")
            .attr("r", CIRCLERADIUS)
            .attr("stroke-width", 0)
            .on("click", nodeClicked);
        //   .attr("fill", function(d) { return color(d.group); })
        // .call(d3.drag()
            // .on("start", dragstarted);
        //     .on("drag", dragged)
        //     .on("end", dragended));
        var simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(function (d) { return d.id; }))
        .stop();
        node.append("title")
            .text(function (d) { return d.id; });

        function nodeClicked(d) {
            svgClicked();
            d3.event.stopPropagation();
            ActivedGraph = graph;

            ActivedGraphNode = d;
            d.color = SelectedColor;
            var nodeId = d.index;
            for (var i = 0; i < graph.nodes.length; ++i) {
                if (graph.D[nodeId][i] === 1) {
                    graph.nodes[i].color = FirstDegreeColor;
                }
                if (graph.D[nodeId][i] === 2) {
                    graph.nodes[i].color = SecondDegreeColor;
                }
            }

            reRender();
        }

        function reRender() {
            link
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; })
                .attr("fill", function (d) {return d.color});

            node
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
                .attr("fill", function (d) {return d.color});
        }
        reRender();
    });
}

function svgClicked() {
    if (ActivedGraph === null) {
        return;
    }
    var nodes = ActivedGraph.nodes,
        links = ActivedGraph.links;
    
    for (var i = 0; i < nodes.length; ++i) {
        nodes[i].color = PlainColor;
    }

    var node = svg
        .selectAll("circle")
        .attr("fill", function (d) {return d.color});

    ActivedGraph = null;
    ActivedGraphNode = null;
}

function enhanceGraph(graph) {
    var nodes = graph.nodes,
        links = graph.links;
    
    for (var i = 0; i < nodes.length; ++i) {
        nodes[i].color = PlainColor;
    }
    for (var i = 0; i < links.length; ++i) {
        links[i].color = PlainColor;
    }
}

// function dragstarted(d) {
//     if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//     d.fx = d.x;
//     d.fy = d.y;
// }

// function dragged(d) {
//     d.fx = d3.event.x;
//     d.fy = d3.event.y;
// }

// function dragended(d) {
//     if (!d3.event.active) simulation.alphaTarget(0);
//     d.fx = null;
//     d.fy = null;
// }
