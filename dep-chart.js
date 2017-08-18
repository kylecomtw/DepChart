
class DepChart {    
    constructor(){              
        let svg = d3.select(".chart");
        let svgRect = svg.node().getBoundingClientRect();
        this.width = svgRect.width;
        this.height = svgRect.height;
        this.MIN_R = 40;
        this.SPIRAL_FAC = 1;
        this.sentenceBases = [0];
        this.tokenData = [];

        d3.json("data/token_data.json", (err, resp) => {
            // console.log(err);
            // console.log(resp);
            // resp = resp.splice(0, 1) ;
            let sentCounter = 0;          
            for(let sent of resp){
              sentCounter += sent.length;
              this.sentenceBases.push(sentCounter);              
            }
            this.sentenceBases.pop();
            
            let data = resp.reduce((a,b)=>a.concat(b));
            // data = data.splice(0, 20);            
            this.tokenData = this.measureToken(data);
            this.drawToken(this.tokenData);

            this.loadDependencies();
        });

                
                  
    }
    
    loadDependencies() {

      d3.json("data/dep_data.json", (err, resp) => {
        if(err){
          console.log(err);
          return;
        }
        
        resp.forEach((sent_x, sent_i) => {
          sent_x.forEach((token_x) => {
            token_x[2] += this.sentenceBases[sent_i];
            token_x[4] += this.sentenceBases[sent_i];
          });
        });
        
        let depList = resp.reduce((a,b)=>a.concat(b));        
        let depData = this.preprocessDeps(depList);
        console.log(depData);
        this.drawDeps(depData);
      })
    }

    measureToken(data){
      let div = d3
          .select("body")
          .append("div").attr("class", "invisible");
      let texts = div
          .selectAll("span")
          .data(data).enter()
          .append("span")
          .text((d)=>d[0]);
      
      let xdist = 0, thetaLast = 0, rLast = this.MIN_R;
      texts.each((x, i, p)=>{                
        let data_x = data[i];        
        
        let rect = p[i].getBoundingClientRect();
        let d = p[i].offsetWidth; //! width in cartesian
        //! r increments in polar
        let rCur = rLast;
        //! theta increments in polar
        let thetaCur = thetaLast;
                
        let thetaNext = thetaLast + 2 * Math.asin(d / (2 * rCur));
        let rNext = (thetaNext / (2 * Math.PI) * this.SPIRAL_FAC + 1) * this.MIN_R;
        // debugger;
        let coordCur = this.toCartesian(rCur, thetaCur);
        let coordNext = this.toCartesian(rNext, thetaNext);

        let rot = Math.atan2((coordNext.y - coordCur.y), (coordNext.x - coordCur.x));
        if (!rot) {
          // debugger;
        }
        data_x["layout"] = {
          w: d, 
          h: p[i].offsetHeight,
          r: (rCur + rNext) / 2, 
          theta: thetaCur,
          x: coordCur.x,          
          y: coordCur.y,          
          rot: rot * 180 / Math.PI
          //rot: 0
         };

        thetaLast = thetaNext;
        rLast = rNext;                
      });

      console.log(data);
      return(data);      
    }

    preprocessDeps(rawDeps){      
      let backwardLinks = new Map();
      let forwardLinks = new Map();
      for (let dep of rawDeps){
        let govIdx = dep[2];
        let depIdx = dep[4];

        let precIdx = Math.min(govIdx, depIdx);
        let followIdx = Math.max(govIdx, depIdx);
        let fwdData = forwardLinks[precIdx] || [];
        let bckData = backwardLinks[followIdx] || [];
        
        fwdData.push(dep);
        bckData.push(dep);

        forwardLinks[precIdx] = fwdData;
        backwardLinks[followIdx] = bckData;        
      }

      let depDistCompareFunc = (a,b)=>{
        let adist = Math.abs(a[2] - a[4]);
        let bdist = Math.abs(b[2] - b[4]);
        return adist-bdist;
      }
      
      let sortLinksValue = (linkData) => {
        for(let item of linkData){
          linkData[item[0]] = item[1].sort(depDistCompareFunc);
        }        
      }

      sortLinksValue(forwardLinks);
      sortLinksValue(backwardLinks);
      
      return({"dep": rawDeps, "fwd": forwardLinks, "bck":backwardLinks});
    }

    drawToken(data){
      let nToken = data.length;      
      let ori = {x: this.width / 2, y: this.height / 2};
      let g = d3.select(".chart").append("g");            
      let xdist = 0;
      let token_elems = g
        .attr("transform", `translate(${ori.x}, ${ori.y}) rotate(180)`)  
        .attr("id", "spiral-g")      
        .selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", (d, i) => {
          let o = d.layout;                          
          return `translate(${o.x}, ${o.y}) rotate(${o.rot})`
        });

      token_elems.append("circle").attr("r", 0);
      token_elems.append("text")
        .attr("text-anchor", "start")            
        .text((d)=>d[0]);
    }
    
    drawDeps(depData) {
      let rawDeps = depData["dep"];
      let g = d3.select("#spiral-g")
        .append("g")
        .attr("id", "deps-g");
      let dep_elem = g
        .selectAll("path")
        .data(rawDeps)
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("d", (d, i)=>{
          return this.generatePathData(d, i, depData);
        });
    }

    // theta in radian
    toCartesian(r, theta){
      // flip y axis for SVG coordinate
      return {x: r*Math.cos(theta), y: r*Math.sin(theta)};
    }       
    
    generatePathData(dep, depIdx, depData){
      let govLayout = this.tokenData[dep[2]]["layout"];
      let depLayout = this.tokenData[dep[4]]["layout"];
      let govLoc = {theta: govLayout.theta, r: govLayout.r};
      let depLoc = {theta: depLayout.theta, r: depLayout.r};
      
      let path_data = [];
      let nStep = Math.ceil(Math.abs(depLoc.theta - govLoc.theta) / (Math.PI / 20));
      let stepi = 0;
      while (stepi < nStep){
        let theta_x = (depLoc.theta - govLoc.theta) * (stepi / nStep) + govLoc.theta;
        let r_x = (depLoc.r - govLoc.r) * (stepi / nStep) + govLoc.r;
        let cart = this.toCartesian(r_x, theta_x);
        path_data.push({ x: cart.x, y: cart.y });
        stepi += 1;
      }
      let line = d3.line().x((d)=>d.x).y((d)=>d.y);
      let dd = line(path_data);
      
      return dd;
    }
    
}

window.onload = (x)=>{
    console.log("loaded");
    depChart = new DepChart();
};

