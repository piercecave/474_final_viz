"user strict;"

const initViz = () => {
    fetchCrashData();
}

const fetchCrashData = () => {
    d3.csv("./nyc_crash_data.csv", function (crashData) {
        drawViz(crashData);
    });
}

const drawViz = (crashData) => {

    crashData.map((crash) => {
        crash.YEAR = new Date(crash["CRASH DATE"]).getFullYear();
    });

    // .key(function (d) {
    //     return d['BOROUGH'];
    // })

    var aggregatedCrashData =
        d3.nest().key(function (d) {
            return d['YEAR'];
        })
            .rollup(function (leaves) {
                return leaves.length;
            }).entries(crashData)
            .map(function (d) {
                return { Year: new Date(d.key), Count: d.value };
            });

    aggregatedCrashData.sort((a, b) => a.Year - b.Year);

    console.log(aggregatedCrashData);

    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 90, left: 100 },
        width = 600 - margin.left - margin.right,
        height = 480 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#vizContainer")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime()
        .domain(d3.extent(aggregatedCrashData, function (d) { return d.Year; }))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            (height + margin.top + margin.bottom - 24) + ")")
        .style("text-anchor", "middle")
        .text("Year");

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedCrashData, function (d) { return +d.Count; })])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 20)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Crashes per Year");

    // Add the line
    svg.append("path")
        .datum(aggregatedCrashData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return x(d.Year) })
            .y(function (d) { return y(d.Count) })
        )
}



initViz();