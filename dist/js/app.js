"use strict";function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}var _createClass=function(){function t(t,e){for(var n=0;n<e.length;n++){var a=e[n];a.enumerable=a.enumerable||!1,a.configurable=!0,"value"in a&&(a.writable=!0),Object.defineProperty(t,a.key,a)}}return function(e,n,a){return n&&t(e.prototype,n),a&&t(e,a),e}}(),DepChart=function(){function t(e,n){var a=this;_classCallCheck(this,t),d3.select("#spiral-wrapper").remove();var r=d3.select(".chart").node().getBoundingClientRect();if(this.width=r.width,this.height=r.height,this.MIN_R=80,this.SPIRAL_FAC=.8,this.DEP_OUTER_RING=!0,this.OUTER_RING_CORRECTION=5,this.sentenceBases=[0],this.tokenData=[],this.debugSlice=-1,this.linkColor="#87CEEB",n)this.loadTestData();else{console.log(e);d3.request("https://desolate-chamber-88538.herokuapp.com/").mimeType("application/json").post(e,function(t,e){t?console.log(t):(a.loadParsingData(JSON.parse(e.response)),document.querySelector("#waiting-wrapper").classList.remove("active"))})}}return _createClass(t,[{key:"loadTestData",value:function(){var t=this;d3.json("data/token_data_2.json",function(e,n){d3.json("data/dep_data_2.json",function(e,a){t.loadParsingData({tokens:n,deps:a})})})}},{key:"loadParsingData",value:function(t){var e=t.tokens;this.debugSlice>0&&(e=e.slice(this.debugSlice,this.debugSlice+4));var n=0,a=!0,r=!1,o=void 0;try{for(var i,s=e[Symbol.iterator]();!(a=(i=s.next()).done);a=!0)n+=i.value.length,this.sentenceBases.push(n)}catch(t){r=!0,o=t}finally{try{!a&&s.return&&s.return()}finally{if(r)throw o}}this.sentenceBases.pop();var l=e.reduce(function(t,e){return t.concat(e)});this.tokenData=this.measureToken(l),this.drawToken(this.tokenData),this.loadDependencies(t.deps)}},{key:"loadDependencies",value:function(t){var e=this;this.debugSlice>0&&(t=t.slice(this.debugSlice,this.debugSlice+4)),t.forEach(function(t,n){t.forEach(function(t){"root"!=t[0]&&(t[2]+=e.sentenceBases[n]-1,t[4]+=e.sentenceBases[n]-1)})});var n=t.reduce(function(t,e){return t.concat(e)}),a=this.preprocessDeps(n);console.log(a),this.drawDeps(a)}},{key:"computeR",value:function(t){return(t/(2*Math.PI)*this.SPIRAL_FAC+1)*this.MIN_R}},{key:"measureToken",value:function(t){var e=this,n=d3.select("body").append("div").attr("class","invisible").selectAll("span").data(t).enter().append("span").text(function(t){return t[0]}),a=0,r=this.MIN_R;return n.each(function(n,o,i){var s=t[o],l=(i[o].getBoundingClientRect(),i[o].offsetWidth),u=r,c=a,h=2*Math.asin(l/(2*u)),p=a+h,d=e.computeR(p),f=e.toCartesian(u,c),y=e.toCartesian(d,p),v=Math.atan2(y.y-f.y,y.x-f.x);s.layout={w:l,h:i[o].offsetHeight,r:(u+d)/2,theta:c,thetaDelta:h,x:f.x,y:f.y,rot:180*v/Math.PI},a=p,r=d}),console.log(t),t}},{key:"preprocessDeps",value:function(t){t=t.filter(function(t){return"root"!=t[0]});var e=this.tokenData.length,n=Array.apply(null,Array(e)).map(function(t){return[]}),a=Array.apply(null,Array(e)).map(function(t){return[]}),r=!0,o=!1,i=void 0;try{for(var s,l=t[Symbol.iterator]();!(r=(s=l.next()).done);r=!0){var u=s.value,c=u[2],h=u[4],p=Math.min(c,h),d=Math.max(c,h);if(!(p<0)){var f=a[p],y=n[d];f.push(u),y.push(u),a[p]=f,n[d]=y}}}catch(t){o=!0,i=t}finally{try{!r&&l.return&&l.return()}finally{if(o)throw i}}var v=function(t,e){var n=Math.abs(t[2]-t[4]);return Math.abs(e[2]-e[4])-n};return a.forEach(function(t){return t.sort(v)}),n.forEach(function(t){return t.sort(v)}),this.computeDepth(t),this.computeLane(t),{dep:t,fwd:a,bck:n}}},{key:"computeDepth",value:function(t){var e=this.tokenData.length,n=Array.apply(null,Array(e)).map(function(t){return[]}),a=Array.apply(null,Array(e)).map(function(t){return[]}),r=!0,o=!1,i=void 0;try{for(var s,l=t[Symbol.iterator]();!(r=(s=l.next()).done);r=!0){var u=s.value,c=Math.min(u[2],u[4]),h=Math.max(u[2],u[4]);n[c].push(u),a[h].push(u)}}catch(t){o=!0,i=t}finally{try{!r&&l.return&&l.return()}finally{if(o)throw i}}for(var p=0,d=function(t,e){return Math.abs(t[2]-t[4])-Math.abs(e[2]-e[4])},f=0;p<this.tokenData.length;){var y=a[p];y=y.sort(d);var v=!0,k=!1,g=void 0;try{for(var m,x=y[Symbol.iterator]();!(v=(m=x.next()).done);v=!0)m.value.depth=f,f-=1}catch(t){k=!0,g=t}finally{try{!v&&x.return&&x.return()}finally{if(k)throw g}}var R=n[p];R=R.sort(d).reverse();var C=!0,w=!1,D=void 0;try{for(var b,T=R[Symbol.iterator]();!(C=(b=T.next()).done);C=!0){b.value;f+=1}}catch(t){w=!0,D=t}finally{try{!C&&T.return&&T.return()}finally{if(w)throw D}}p+=1}}},{key:"computeLane",value:function(t){var e=Math.max.apply(null,t.map(function(t){return t.depth}));t.forEach(function(t){return t.lane=e-t.depth})}},{key:"drawToken",value:function(t){var e=this,n=(t.length,{x:this.width/2,y:this.height/2}),a=d3.select(".chart").append("g").attr("id","spiral-wrapper").append("g").attr("transform","translate("+n.x+", "+n.y+") rotate(180)").attr("id","spiral-g").selectAll("g").data(t).enter().append("g").attr("transform",function(t,e){var n=t.layout;return"translate("+n.x+", "+n.y+") rotate("+n.rot+")"}).attr("token-id",function(t,e){return e}).on("click",function(t,n){d3.selectAll(".dep-link").attr("stroke",e.linkColor),d3.selectAll(".dep-gov-"+n).attr("stroke","red"),d3.selectAll(".dep-dep-"+n).attr("stroke","orange")});a.append("circle").attr("r",0).attr("cx",function(t,e){return t.layout.w/2}),a.append("text").attr("class","token-text").attr("text-anchor","start").text(function(t){return t[0]}),a.append("text").attr("class","token-pos").attr("text-anchor","middle").attr("dx",function(t){return t.layout.w/2}).attr("dy",function(t){return t.layout.h-5}).text(function(t){return mapPos(t[1])})}},{key:"drawDeps",value:function(t){var e=this,n=t.dep;d3.select("#spiral-g").append("g").attr("id","deps-g").selectAll("path").data(n).enter().append("path").attr("fill","none").attr("stroke",function(t,n){return e.linkColor}).attr("d",function(n,a){return e.generatePathData(n,t)}).attr("class",function(t,e){return"dep-link dep-gov-"+t[2]+" dep-dep-"+t[4]})}},{key:"toCartesian",value:function(t,e){return{x:t*Math.cos(e),y:t*Math.sin(e)}}},{key:"generatePathData",value:function(t,e){var n=t[2],a=t[4],r=this.tokenData[n].layout,o=this.tokenData[a].layout,i=this.getEndpoint(t,e,n,r),s=this.getEndpoint(t,e,a,o),l=this.toCartesian(i.anchorR,i.anchorTheta),u=this.toCartesian(s.anchorR,s.anchorTheta),c=this.toCartesian(i.endpointR,i.endpointTheta),h=this.toCartesian(s.endpointR,s.endpointTheta),p=[];p.push({x:l.x,y:l.y},{x:c.x,y:c.y});for(var d=i.endpointTheta,f=0,y=Math.sign(s.endpointTheta-i.endpointTheta),v=r.h;;){var k=this.computeLaneR(this.computeR(d),v,t.lane),g=this.toCartesian(k,d);p.push({x:g.x,y:g.y});if(d+=2*y*Math.asin(5/(2*k)),y>0&&d>s.endpointTheta||y<0&&d<s.endpointTheta)break;if(f>1e3)break;f+=1}return p.push({x:h.x,y:h.y},{x:u.x,y:u.y}),d3.line().x(function(t){return t.x}).y(function(t){return t.y})(p)}},{key:"computeLaneR",value:function(t,e,n){return this.DEP_OUTER_RING?t+e-this.OUTER_RING_CORRECTION+(2*n+5):t-(2*n+5)}},{key:"getEndpoint",value:function(t,e,n,a){var r=e.fwd[n].indexOf(t),o=e.bck[n].indexOf(t),i=0,s=this.computeLaneR(a.r,a.h,t.lane);i=r>=0?a.theta+a.thetaDelta/2+.01*(r+.5):a.theta+a.thetaDelta/2-.01*(o+.5);var l={anchorR:a.r,anchorTheta:i,endpointR:s,endpointTheta:i};return this.DEP_OUTER_RING&&(l.anchorR+=a.h-this.OUTER_RING_CORRECTION),l}}]),t}();window.onload=function(t){console.log("loaded");var e=[];if(window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,function(t,n,a){e[n]=a}),"text"in e){var n=e.text;n=decodeURIComponent(n),console.log(n);new DepChart(n,!1)}else new DepChart("",!0);document.querySelector("#input-box").addEventListener("keypress",function(t){if(13==(t.which||t.keyCode)){document.querySelector("#waiting-wrapper").className="active";new DepChart(t.srcElement.value,!1)}})};var mapPos=function(t){return"N"==t[0]?"N":"V"==t[0]?"V":t};