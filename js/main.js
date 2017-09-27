var svg = d3.select("svg");

var width = $('svg').width(),
    height = $('svg').height();

var CIRCLERADIUS = 2;

d3.json("/data/large.json", function (error, graph) {
    if (error) throw error;
    console.log(graph.nodes.length);
    console.log(graph.links.length);
    console.time('Calculate Connected Components');
    components = CCCalculator.divideGraph(graph);
    console.timeEnd('Calculate Connected Components');
    components = components.slice(0, 1);
    // dynamicRender(components);
    dynamicStressMinimization(components);
    // CCLayout.setViewSize(width, height);
    // CCLayout.apply(components);

    // renderCC(components);
});

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
    var D = CCLayout.floydWarshall(graph);
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
    ticked();    
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
        
        link
            .attr("x1", function (d) { return d.source.x * scale + offesetX; })
            .attr("y1", function (d) { return d.source.y * scale + offesetY; })
            .attr("x2", function (d) { return d.target.x * scale + offesetX; })
            .attr("y2", function (d) { return d.target.y * scale + offesetY; });

        node
            .attr("cx", function (d) { return d.x * scale + offesetX; })
            .attr("cy", function (d) { return d.y * scale + offesetY; });

        if (iteration < 300) {
            setTimeout(ticked, 50);
        }
    }
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
            .attr("r", 5)

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
    cc.forEach(function (graph) {
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
            .attr("r", CIRCLERADIUS);
        //   .attr("fill", function(d) { return color(d.group); })
        // .call(d3.drag()
        //     .on("start", dragstarted)
        //     .on("drag", dragged)
        //     .on("end", dragended));

        node.append("title")
            .text(function (d) { return d.id; });

        link
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });
    });
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
