
var chart_data = {
    vec: [1,2,3,4,5]
};

class DepChart {    
    constructor(){
        let data = chart_data.vec;
        let x = d3.scaleLinear()
            .domain([0, d3.max(data)])
            .range([0, 420]);
        
        d3.select(".chart")
          .selectAll("div")
          .data(data)
          .enter().append("div")
          .style("width", (d) => x(d)+"px")
          .text((d)=>d);

        console.log("hello there");
    }
}

window.onload = (x)=>{
    console.log("loaded");
    depChart = new DepChart();
};

