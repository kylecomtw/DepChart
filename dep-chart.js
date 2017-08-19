
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
        this.debugSlice = 17;
        d3.json("data/token_data.json", (err, resp) => {
            // console.log(err);
            // console.log(resp);            
            resp = resp.slice(this.debugSlice, this.debugSlice + 1) ;
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
        resp = resp.slice(this.debugSlice, this.debugSlice + 1) ;
        resp.forEach((sent_x, sent_i) => {
          sent_x.forEach((token_x) => {
            token_x[2] += this.sentenceBases[sent_i] - 1;
            token_x[4] += this.sentenceBases[sent_i] - 1;
          });
        });
        
        let depList = resp.reduce((a,b)=>a.concat(b));        
        let depData = this.preprocessDeps(depList);
        console.log(depData);
        this.drawDeps(depData);
      })
    }

    computeR(theta){
      return (theta / (2 * Math.PI) * this.SPIRAL_FAC + 1) * this.MIN_R;
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
        
        let thetaDelta = 2 * Math.asin(d / (2 * rCur));
        let thetaNext = thetaLast + thetaDelta;
        let rNext = this.computeR(thetaNext);        
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
          thetaDelta: thetaDelta,
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
      rawDeps = rawDeps.filter((x)=>x[0] != "root");
      let nToken = this.tokenData.length;
      let backwardLinks = Array.apply(null, Array(nToken)).map((x)=>[])
      let forwardLinks = Array.apply(null, Array(nToken)).map((x)=>[])
      
      for (let dep of rawDeps){
        let govIdx = dep[2];
        let depIdx = dep[4];

        let precIdx = Math.min(govIdx, depIdx);
        let followIdx = Math.max(govIdx, depIdx);
        if (precIdx < 0) {
          // ROOT case, not drawing this link
          continue;
        }
        let fwdData = forwardLinks[precIdx];
        let bckData = backwardLinks[followIdx];
        
        
        fwdData.push(dep);
        bckData.push(dep);

        forwardLinks[precIdx] = fwdData;
        backwardLinks[followIdx] = bckData;        
      }

      let depDistCompareFunc = (a,b)=>{
        let adist = Math.abs(a[2] - a[4]);
        let bdist = Math.abs(b[2] - b[4]);
        return bdist-adist;
      }
      
      let sortLinksValue = (linkData) => {
        for(let item of linkData){
          linkData[item[0]] = item[1].sort(depDistCompareFunc);
        }        
      }

      forwardLinks.forEach((x)=>x.sort(depDistCompareFunc));
      backwardLinks.forEach((x)=>x.sort(depDistCompareFunc));            

      //! compute depLink lanes
      this.computeDepth(rawDeps);
      this.computeLane(rawDeps);
      return({"dep": rawDeps, "fwd": forwardLinks, "bck":backwardLinks});
    }

    computeDepth(rawDeps){
      let counter = 0;
      let nToken = this.tokenData.length;
      let depMapPrec = Array.apply(null, Array(nToken)).map((x)=>[]);
      let depMapFollow = Array.apply(null, Array(nToken)).map((x)=>[]);
      for(let dep_x of rawDeps){
        let precIdx = Math.min(dep_x[2], dep_x[4]);
        let followIdx = Math.max(dep_x[2], dep_x[4]);
        depMapPrec[precIdx].push(dep_x);
        depMapFollow[followIdx].push(dep_x);
      }

      let tokenIdx = 0;      
      let depDistCompareFunc = (a,b)=>{
        let adist = Math.abs(a[2] - a[4]);
        let bdist = Math.abs(b[2] - b[4]);
        return adist-bdist;
      }

      let openCounter = 0;
      let depBuffer = [];
      while(tokenIdx < this.tokenData.length){
        //! cleanup closing deps
        let endingDeps = depMapFollow[tokenIdx];
        endingDeps = endingDeps.sort(depDistCompareFunc);
        for(let dep_x of endingDeps){          
          dep_x["depth"] = openCounter;          
          openCounter -= 1;
        }

        //! creating opening deps
        let startingDeps = depMapPrec[tokenIdx];
        startingDeps = startingDeps.sort(depDistCompareFunc).reverse();
        for(let dep_x of startingDeps){          
          openCounter += 1;
        }

        tokenIdx += 1;
      }
    }

    computeLane(rawDeps) {
      let maxDepth = Math.max.apply(null, rawDeps.map((x)=>x.depth));
      rawDeps.forEach((x)=>x.lane = maxDepth - x.depth);
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
        .attr("stroke", (d, i) => {
          return "blue";
        })
        .attr("d", (d, i)=>{
          return this.generatePathData(d, depData);
        });
        
    }

    // theta in radian
    toCartesian(r, theta){
      // flip y axis for SVG coordinate
      return {x: r*Math.cos(theta), y: r*Math.sin(theta)};
    }       
    
    generatePathData(dep, depData){
      let govIdx = dep[2];
      let depIdx = dep[4];
      let govLayout = this.tokenData[govIdx]["layout"];
      let depLayout = this.tokenData[depIdx]["layout"];
      let govEndpoint = this.getEndpoint(dep, depData, govIdx, govLayout);
      let depEndpoint = this.getEndpoint(dep, depData, depIdx, depLayout);
      
      //! draw vertical tangent line in governor side
      let c_govAnchor = this.toCartesian(govEndpoint.anchorR, govEndpoint.anchorTheta);
      let c_depAnchor = this.toCartesian(depEndpoint.anchorR, depEndpoint.anchorTheta);
      let c_govEndpoint = this.toCartesian(govEndpoint.endpointR, govEndpoint.endpointTheta);
      let c_depEndpoint = this.toCartesian(depEndpoint.endpointR, depEndpoint.endpointTheta);

      let path_data = [];  

      path_data.push(
        {x: c_govAnchor.x, y: c_govAnchor.y}, 
        {x: c_govEndpoint.x, y: c_govEndpoint.y} );      
            

      //! draw the arc
      let theta_x = govEndpoint.endpointTheta;
      
      let counter = 0;
      let sgn = Math.sign(depEndpoint.endpointTheta - govEndpoint.endpointTheta);
      while (true){        
        let r_x = this.computeLaneR(this.computeR(theta_x), dep.lane);
        let cart = this.toCartesian(r_x, theta_x);
        path_data.push({ x: cart.x, y: cart.y });
        let linkStepDist = 5;
        theta_x += sgn * 2 * Math.asin(linkStepDist / (2 * r_x));        
        
        if ((sgn > 0 && theta_x > depEndpoint.endpointTheta) || 
            (sgn < 0 && theta_x < depEndpoint.endpointTheta)){
          break;
        }

        if (counter > 1000) {          
          break;
        }
        counter += 1;
      }

      //! draw vertical tangent line in dependent side
      path_data.push(
        {x: c_depEndpoint.x, y: c_depEndpoint.y},
        {x: c_depAnchor.x, y: c_depAnchor.y});

      let line = d3.line().x((d)=>d.x).y((d)=>d.y);
      let dd = line(path_data);
      
      return dd;
    }
    
    computeLaneR(spiralR, lane){
      return spiralR - (lane * 2 + 5);
    }

    getEndpoint(dep, depData, tokenIdx, tokenLoc){
            
      let fwdIdx = depData.fwd[tokenIdx].indexOf(dep);
      let bckIdx = depData.bck[tokenIdx].indexOf(dep);
      
      let anchor = 0;
      let theta = 0;
      let r = this.computeLaneR(tokenLoc.r, dep.lane);
      if (fwdIdx >= 0){
        theta = tokenLoc.theta + tokenLoc.thetaDelta / 2 + 0.05 * fwdIdx;
      } else {
        theta = tokenLoc.theta + tokenLoc.thetaDelta / 2 - 0.05 * (bckIdx+1);
      }      

      // debugger;
      return {anchorR: tokenLoc.r, anchorTheta: theta,
              endpointR: r, endpointTheta: theta};
    }
}

window.onload = (x)=>{
    console.log("loaded");
    depChart = new DepChart();
};

