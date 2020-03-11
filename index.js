"user strict;"

var tooltip = "";

const initViz = () => {
    fetchCrashData();
}

const fetchCrashData = () => {
    d3.csv("./nyc_data.csv", function (crashData) {
        createTooltip();
        initFilter(crashData);
        drawViz(crashData);
    });
}

const createTooltip = () => {
    tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "6px")
        .attr("id", "tooltip");
}

const initFilter = (crashData) => {
    var uniqueFactors = Array.from(crashData, crash => crash["CONTRIBUTING FACTOR VEHICLE 1"]).filter(onlyUnique);

    d3.select("#factorSelect")
        .selectAll('option')
        .data(uniqueFactors)
        .enter()
        .append("option")
        .attr("value", function (d) { return d })
        .text(function (d) { return d });

    document.getElementById("factorSelect").onchange = () => {
        drawViz(crashData);
    }
}

const drawViz = (crashData) => {

    document.getElementById('vizContainer').innerHTML = "";

    crashData.map((crash) => {
        crash.YEAR = new Date(crash["CRASH DATE"]).getFullYear();
    });

    var selectedFactor = document.getElementById("factorSelect").value;

    if (selectedFactor.localeCompare("All") != 0) {
        crashData = crashData.filter(function (e) {
            return e['CONTRIBUTING FACTOR VEHICLE 1'].localeCompare(selectedFactor) == 0;
        });
    }

    // .key(function (d) {
    //     return d['BOROUGH'];
    // })

    var aggregatedCrashData =
        d3.nest().key(function (d) {
            return d['YEAR'];
        })
            .rollup(function (leaves) {
                return {
                    crashesCount: leaves.length,
                    totalCasualties: d3.sum(leaves, function (d) { return d["NUMBER OF PERSONS KILLED"]; }),
                    totalInjuries: d3.sum(leaves, function (d) { return d["NUMBER OF PERSONS INJURED"]; })
                }
            }).entries(crashData)
            .map(function (d) {
                return {
                    Year: new Date(d.key + "-01-02"),
                    crashesCount: d.value.crashesCount,
                    totalCasualties: d.value.totalCasualties,
                    totalInjuries: d.value.totalInjuries
                };
            });

    aggregatedCrashData.sort((a, b) => a.Year - b.Year);

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
        .domain([0, d3.max(aggregatedCrashData, function (d) { return +d.crashesCount; })])
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
        .text("Crashes");

    // Add the liness
    svg.append("path")
        .datum(aggregatedCrashData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return x(d.Year) })
            .y(function (d) { return y(d.crashesCount) })
        );

    svg.selectAll(".marker")
        .data(aggregatedCrashData)
        .enter()
        .append("circle")
        .attr("class", 'markers')
        .attr("r", 3)
        .style("fill", "steelblue")
        .attr("cx", function (d) { return x(d.Year) })
        .attr("cy", function (d) { return y(d.crashesCount) })
        .on("mouseover", (d) => { mouseover(d) })
        .on("mousemove", mousemove)
        .on("mouseleave", (d) => { mouseleave(d) });
}

const mouseover = (d) => {
    tooltip
        .style("opacity", 1)
}

const mousemove = (d, i) => {
    tooltip
        .html("<h3>Casualties & Injuries in " + d.Year.getFullYear() + "</h3>")
        .style("left", (d3.event.pageX + 40) + "px")
        .style("top", (d3.event.pageY - 30) + "px");

    drawTooltipViz(d, i);
}

const drawTooltipViz = (d, i) => {

    var filteredData = [{
        statName: "Casualties",
        statValue: +d.totalCasualties
    }, {
        statName: "Injuries",
        statValue: +d.totalInjuries
    }];

    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 200 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    var y = d3.scaleLinear()
        .range([height, 0]);

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = tooltip.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data in the domains
    x.domain(filteredData.map(function (d) { return d.statName; }));
    y.domain([0, d3.max(filteredData, function (d) { return d.statValue })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(filteredData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("fill", "steelblue")
        .attr("x", function (d) { return x(d.statName); })
        .attr("width", x.bandwidth())
        .attr("y", function (d) { return y(d.statValue); })
        .attr("height", function (d) { return height - y(d.statValue); });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

}

const mouseleave = (d) => {
    tooltip
        .transition()
        .style("opacity", 0)
}

const onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index;
}

initViz();