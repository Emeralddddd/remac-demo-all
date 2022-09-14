import {Component, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';

const flextree = require('d3-flextree').flextree;
import * as d3 from "d3"
import {select} from "d3";
import * as echarts from "echarts";


interface Drange {
  leftRange: { left: number, right: number },
  rightRange: { left: number, right: number },
}

@Component({
  selector: 'app-adaptive',
  templateUrl: './adaptive.component.html',
  styleUrls: ['./adaptive.component.css']
})
export class AdaptiveComponent implements OnInit {
  parseLastDrange():void{
    // @ts-ignore
    const drange:Drange = this.newCostGraph[this.newCostGraph.length-1].drangeNodes[0].drange
    const isConstant = this.newCostGraph[this.newCostGraph.length-1].drangeNodes[0].nodes[0].isConstant
    const thisCost = this.newCostGraph[this.newCostGraph.length-1].drangeNodes[0].nodes[0].thisCost
    const ll = drange.leftRange.left;
    const lr = drange.leftRange.right;
    const rl = drange.rightRange.left;
    const rr = drange.rightRange.right;
    this.dranges = this.parseDrange(ll,lr,rl,rr,thisCost,isConstant,true,-1)
  }

  parseDrange(ll: number, lr: number, rl: number, rr: number, cost: number, isConstant: Boolean, isLeft: Boolean,cseCost:number): any {
    const lnode = this.newCostGraph.find(d => d.range.left === ll && d.range.right === lr);
    const rnode = this.newCostGraph.find(d => d.range.left === rl && d.range.right === rr);
    const lVar = this.variables.slice(ll, lr + 1);
    const rVar = this.variables.slice(rl, rr + 1);
    const children: any[] = [];
    // @ts-ignore
    lnode.drangeNodes.forEach(d => {
      if (lr > ll) {
        //@ts-ignore
        const drange: Drange = d.drange;//@ts-ignore
        const cseCost = d.nodes.length>1?d.nodes[1].thisCost:-1;
        children.push(this.parseDrange(drange.leftRange.left, drange.leftRange.right, drange.rightRange.left, drange.rightRange.right, d.nodes[0].thisCost, d.nodes[0].isConstant, true,cseCost))
      }
    })
    // @ts-ignore
    rnode.drangeNodes.forEach(d => {
      if (rr > rl) {
        //@ts-ignore
        const drange: Drange = d.drange;//@ts-ignore
        const cseCost = d.nodes.length>1?d.nodes[1].thisCost:-1;
        children.push(this.parseDrange(drange.leftRange.left, drange.leftRange.right, drange.rightRange.left, drange.rightRange.right, d.nodes[0].thisCost, d.nodes[0].isConstant, false,cseCost))
      }
    })
    const exWidth = cseCost>0?55:0;
    return {
      ll: ll,
      rl: rl,
      lVar: lVar,
      rVar: rVar,
      cost: cost,
      isConstant: isConstant,
      children: children,
      isLeft: isLeft,
      width:(lVar.length +rVar.length) * 30 + 100 + exWidth,
      cseCost:cseCost
    }
  }

  drawComparison():void{
    type EChartsOption = echarts.EChartsOption;// @ts-ignore
    if(this.Chart1!=null) this.Chart1.dispose();// @ts-ignore
    if(this.Chart2!=null) this.Chart2.dispose();
    const chartDom =document.getElementById('comparisonBar1');//@ts-ignore
    const Chart1 = echarts.init(chartDom);// @ts-ignore
    const Chart2 = echarts.init(document.getElementById('comparisonBar2'))// @ts-ignore
    this.Chart1 = Chart1;// @ts-ignore
    this.Chart2 = Chart2;
    const bfeTime = isNaN(Number(this.times[5]))?3600:Number(this.times[5]);
    let option1:EChartsOption;
    let option2:EChartsOption;
    option1 = {
      xAxis: {
        type: 'category',
        data: ['Dynamic Programming','Enumeration'],
      },
      yAxis: {
        type: 'log',
        min:1,
        name:'Time(s)',
        nameRotate:90,
        nameLocation:'middle',
        nameGap:45
      },
      series: [
        {
          name: 'Compilation Time',
          data: [this.times[4],bfeTime],
          type: 'bar',
          stack: 'x',//@ts-ignore
          label:{show:true,position:'top',formatter:(params)=>params.data>=3600?'more than 1 hour':params.data},
        },
      ],
    };// @ts-ignore
    option2 = {
      xAxis: {
        type: 'category',
        data: ['With Optimization','Without Optimization'],
      },
      yAxis: {
        type: 'log',
        name:'Time(s)',
        nameRotate:90,
        min:1,
        nameLocation:'middle',
        nameGap:45
      },
      series: [
        {
          name: 'Compilation Time',
          data: [this.times[0],this.times[1]],
          type: 'bar',
          stack: 'x',//@ts-ignore
          label:{show:true,position:'top',formatter:(params)=>params.data>=3600?'more than 1 hour':params.data},
        },
      ],
    };
    Chart1.setOption(option1);
    Chart2.setOption(option2);
  }

  clearCostGraph():void{
    d3.select('#costGraph').selectAll('*').remove();
  }

  drawCost(): void {//@ts-ignore
    const layout = flextree().nodeSize(d=>[d.width,120])
    const root = d3.hierarchy(this.dranges);

    const update = () => {//@ts-ignore
      const newlayout = d3.tree().nodeSize([240,120]).separation((a,b)=>(a.data.lVar.length+a.data.rVar.length+b.data.lVar.length+b.data.rVar.length)/6);
      newlayout(root);
      const lines = g.select(".gLink")
        .selectAll("line")
        .data(root.links())
        .join("line")
        //@ts-ignore
        .attr('x1', d => d.target.data.isLeft ? d.source.x + d.source.data.lVar.length * 15 : d.source.x + d.source.data.lVar.length * 30 + d.source.data.rVar.length * 15 + 20).attr('y1', d => d.source.y + 80).attr('x2', d => d.target.x + (d.target.data.lVar.length + d.target.data.rVar.length) * 15 + 50).attr('y2', d => d.target.y);

      const nodes = g.selectAll(".rect")
        .data(root.descendants())
        .join("g")
        //@ts-ignore
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .classed("rect", true)
        .on("click", (e, d) => {
          if (d.children) {//
            //@ts-ignore
            d._children = d.children;
            //@ts-ignore
            d.children = null;
          } else {          //@ts-ignore
            d.children = d._children;          //@ts-ignore
            d._children = null;
          }
          update();
        })

      nodes.selectAll('*').remove();

      nodes.append("rect")
        .attr("stroke", "#87CEEB")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", 5)
        .attr("fill", "#fff")
        .attr("fill-opacity", 0)
        //@ts-ignore
        .attr('width', d => d.data.width)
        .attr('height', 80)
        .attr('rx', 10)
        .attr('ry', 10);

      nodes.append("g")
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill", "#fff")
        .selectAll("rect")
        //@ts-ignore
        .data(d => d.data.lVar)
        .join("rect")
        .attr("height", 30)
        .attr("width", 30)
        .attr('x', (_, i) => i * 30 + 10)
        .attr('y', 40)

      nodes.append("g")
        .selectAll("text")
        //@ts-ignore
        .data(d => d.data.lVar)
        .join("text")
        .attr('x', (_, i) => i * 30 + 18)
        .attr('y', 65)
        //@ts-ignore
        .html(d => d.toString());

      nodes.append("text")
        .attr('x', 10)
        .attr('y', 30)
        .style('font-size', '18px')
        //@ts-ignore
        .html((d: any) => {
          const a = [];
          for (let i = 0; i < d.data.lVar.length; i++) {
            a.push(i + d.data.ll)
          }
          return '{' + a.toString() + '}';
        })

      nodes.append("text")//@ts-ignore
        .attr('x', d => d.data.lVar.length * 30 + 30)
        .attr('y', 30)
        .style('font-size', '18px')
        //@ts-ignore
        .html((d: any) => {
          const a = [];
          for (let i = 0; i < d.data.rVar.length; i++) {
            a.push(i + d.data.rl)
          }
          return '{' + a.toString() + '}';
        })

      nodes.append("g")
        .attr("transform", (d: any) => `translate(${d.data.lVar.length * 30 + 20},0)`)
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill", "#fff")
        .selectAll("rect")
        //@ts-ignore
        .data(d => d.data.rVar)
        .join("rect")
        .attr("height", 30)
        .attr("width", 30)
        .attr('x', (_, i) => i * 30 + 10)
        .attr('y', 40)

      nodes.append("g")
        .attr("transform", (d: any) => `translate(${d.data.lVar.length * 30 + 20},0)`)
        .selectAll("text")
        //@ts-ignore
        .data(d => d.data.rVar)
        .join("text")
        .attr('x', (_, i) => i * 30 + 18)
        .attr('y', 65)
        //@ts-ignore
        .html(d => d.toString());

      nodes.append("text")
        //@ts-ignore
        .attr('x', d => d.data.lVar.length * 30 + 14)
        .attr('y', 63)
        .style('font-size', 24)
        .html((d: any) =>this.operators[d.data.rl-1]);

      nodes.append("ellipse")//@ts-ignore
        .attr('cx', d => (d.data.lVar.length + d.data.rVar.length) * 30 + 70)
        .attr('cy', 55)
        .attr('rx', 25)
        .attr('ry', 20)//@ts-ignore
        .attr('fill',   d=>d.data.isConstant?'#87CEFA':'#999')
        .attr('stroke','#000');

      nodes.append("ellipse")//@ts-ignore
        .attr('cx', d => (d.data.lVar.length + d.data.rVar.length) * 30 + 125)
        .attr('cy', 55)
        .attr('rx', 25)
        .attr('ry', 20)
        .attr('fill',   '#ffffe0')//@ts-ignore
        .attr('fill-opacity',d=>d.data.cseCost>0?1:0)
        .attr('stroke','#000')//@ts-ignore
        .attr('stroke-opacity',d=>d.data.cseCost>0?1:0);

      nodes.append("text")//@ts-ignore
        .attr('x', d => (d.data.lVar.length + d.data.rVar.length) * 30 + 50)
        .attr('y', 60)
        .style('font-size', '12px')//@ts-ignore
        .html(d =>  d.data.cost.toExponential(2));

      nodes.append("text")//@ts-ignore
        .attr('x', d => (d.data.lVar.length + d.data.rVar.length) * 30 + 105)
        .attr('y', 60)
        .style('font-size', '12px')//@ts-ignore
        .html(d => d.data.cseCost>0?d.data.cseCost.toExponential(2):'');
    }


    const svg = d3.select("#costGraph").append("svg")
      .attr("width", 1600)
      .attr("height", 600)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 22)
      //@ts-ignore
      .call(d3.zoom().scaleExtent([0.1, 10]).on('zoom', (e) => {
        g.attr('transform', e.transform)
      }));
    const defs = svg.append("defs");

    const arrowMarker = defs.append("marker")
      .attr("id", "arrow")
      .attr("markerUnits", "strokeWidth")
      .attr("markerWidth", 12)
      .attr("markerHeight", 12)
      .attr("viewBox", "0 0 12 12")
      .attr("refX", 6)
      .attr("refY", 6)
      .attr("orient", "auto");

    const arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";

    arrowMarker.append("path")
      .attr("d", arrow_path)
      .attr("fill", "#000");

    const g = svg.append('g').attr("transform", "translate(0,0) scale(1)");

    const lines = g.append("g")
      .classed("gLink", true)
      .attr("fill", "none")//@ts-ignore
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.9)
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    const collapse = (root:any)=>{
      if(root.children){
        for (let i = 0; i < root.children.length; i++) {
          collapse(root.children[i])
        }
        root._children = root.children;
        root.children = null;
      }
    }
    collapse(root);
    update();


  }

  drawPlan1(): void {
    const ht = new Map();

    const parseSolution=(root:any)=>{
      if(root.name==='t') root.name='𝑇';
      if(root.name==='theta') root.name = 'θ'
      for (let i = 0; i < root.children.length; i++) {
        const preLoop = this.test_preLoop.find(item=>item.nodes.name==root.children[i].name);
        if(preLoop) {
          root.children[i]=preLoop.nodes.children[0];
          root.children[i].isPreLoop=true;
        }
        if(root.children[i].name=='cast') root.children[i]=root.children[i].children[0]
      }//@ts-ignore
      root.children.forEach(d=>{
        parseSolution(d)}
      )
      if(!root.reference){
        ht.set(root.hopID,root)
      }else {
        const a = ht.get(root.hopID)
        root.children=a.children;
      }
    }
    const nodes = JSON.parse(JSON.stringify(this.test_origin.nodes));
    parseSolution(nodes);

    const root = d3.hierarchy(nodes.children[0]);
    const treelayout = d3.tree().nodeSize([50, 50]);

    const update = () => {
      treelayout(root);
      const lines = g.select(".gLink")
        .selectAll("line")
        .data(root.links())
        .join("line")
        //@ts-ignore
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);

      const nodes = g.selectAll(".circle")
        .data(root.descendants())
        .join("g")
        //@ts-ignore
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .classed("circle", true)
        .on("click", (e, d) => {
          if (d.children) {//
            //@ts-ignore
            d._children = d.children;
            //@ts-ignore
            d.children = null;
          } else {          //@ts-ignore
            d.children = d._children;          //@ts-ignore
            d._children = null;
          }
          update();
        })

      nodes.append("circle")
        .attr("stroke", "#111")
        .attr("stroke-width", 2)
        .attr("fill", "#fff")
        .attr("fill-opacity", 1)
        .attr('x', 0)
        .attr('y', 0)
        .attr('r',20);

      nodes.append("text")
        .attr('x', -6)
        .attr('y', 8)
        //@ts-ignore
        .html(d => d.data.name);
    }

    d3.select("#planGraph1").select("*").remove();
    const svg = d3.select("#planGraph1").append("svg")
      .attr("width", 800)
      .attr("height", 400)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 25)
      //@ts-ignore
      .call(d3.zoom().scaleExtent([0.1, 10]).on('zoom', (e) => {
        g.attr('transform', e.transform)
      }));

    const g = svg.append('g').attr("transform", "translate(0,20) scale(0.8)");

    const lines = g.append("g")
      .classed("gLink", true)
      .attr("fill", "none")//@ts-ignore
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.9)
      .attr("stroke-width", 1.5)

    update();

  }

  drawPlan2(): void {
    const markDes=(root:any)=>{
      if(root.children.length>0) root.bgColor='#FFFFE0';
      if(root.isPreLoop) root.bgColor='#87CEFA'//@ts-ignore
      root.children.forEach(d=>markDes(d))
    }
    const ht = new Map();
    const parseSolution=(root:any)=>{
      if(root.name==='t') root.name='𝑇';
      if(root.name==='theta') root.name = 'θ'//@ts-ignore
      root.children.forEach(d=>parseSolution(d))
      if(!root.reference){
        ht.set(root.hopID,root)
      }else {
        const a = ht.get(root.hopID);
        root.children=a.children;
        markDes(root);
      }
      for (let i = 0; i < root.children.length; i++) {
        const preLoop = this.test_preLoop.find(item=>item.nodes.name==root.children[i].name);
        if(preLoop) {
          root.children[i]=preLoop.nodes.children[0];
          root.children[i].isPreLoop=true;
        }
        if(root.children[i].name=='cast') root.children[i]=root.children[i].children[0]
      }
    }
    parseSolution(this.test_body.nodes);


    const root = d3.hierarchy(this.test_body.nodes.children[0]);
    const treelayout = d3.tree().nodeSize([50, 50]);

    const update = () => {
      treelayout(root);
      const lines = g.select(".gLink")
        .selectAll("line")
        .data(root.links())
        .join("line")
        //@ts-ignore
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);

      const nodes = g.selectAll(".circle")
        .data(root.descendants())
        .join("g")
        //@ts-ignore
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .classed("circle", true)
        .on("click", (e, d) => {
          if (d.children) {//
            //@ts-ignore
            d._children = d.children;
            //@ts-ignore
            d.children = null;
          } else {          //@ts-ignore
            d.children = d._children;          //@ts-ignore
            d._children = null;
          }
          update();
        })

      nodes.append("circle")
        .attr("stroke", "#111")
        .attr("stroke-width", 2)//@ts-ignore
        //.attr("stroke-dasharray",d=>d.data.reference?5:0)
        .attr("fill", d=>d.data.bgColor?d.data.bgColor:'#fff')
        .attr("fill-opacity", 1)
        .attr('x', 0)
        .attr('y', 0)
        .attr('r',20);

      nodes.append("text")
        .attr('x', -6)
        .attr('y', 8)
        //@ts-ignore
        .html(d => d.data.name);
    }
    d3.select("#planGraph2").select("*").remove();
    const svg = d3.select("#planGraph2").append("svg")
      .attr("width", 800)
      .attr("height", 400)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 25)
      //@ts-ignore
      .call(d3.zoom().scaleExtent([0.1, 10]).on('zoom', (e) => {
        g.attr('transform', e.transform)
      }));

    const g = svg.append('g').attr("transform", "translate(0,20) scale(0.8)");

    const lines = g.append("g")
      .classed("gLink", true)
      .attr("fill", "none")//@ts-ignore
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.9)
      .attr("stroke-width", 1.5)

    update();

  }

  readBlocks(): void {
    this.variables = [];
    this.operators = [];
    this.splits = [];
    for (let i = 0; i < this.test_blocks.length; i++) {
      const b = this.test_blocks[i];
      const ops = b.name.replace(/({|\s})/g, '').split(' ');
      ops.forEach(x => {
        x = x.replace(/t\((\S)\)/, '$1ᵀ')
        x = x.replace(/theta/,'θ')
        this.variables.push(x);
      });
      this.splits.push([b.range.left, b.range.right]);
    }
    this.operators = this.test_operators.map(d => d === '*' ? '∙' : d)
  }

  initial(): void{
    this.isShow=true;
    this.readBlocks();
    // this.dranges = this.parseDrange(0, 19, 20, 29, 7.51323078E7, false, true,-1);
    this.parseLastDrange();
    this.drawComparison();
    this.drawPlan1();
    this.drawPlan2();
  }
  chooseAlgorithm(data: string): void {
    this.curAlgorithm = data;
  }

  chooseMethod(data: string): void {
    this.curMethod = data;
  }

  incStep(): void {
    this.curStep = this.curStep + 1;
    this.getStepCostGraph(this.curStep,this.curAlgorithm);
  }

  decStep(): void {
    if(this.curStep>0){
      this.curStep = this.curStep - 1;
      this.getStepCostGraph(this.curStep,this.curAlgorithm);
    }
  }

  getStepCostGraph(step: number,alg: string):void {
    let url = `http://localhost:8080/adaptive/costgraph?step=${step}&alg=${alg}`
    this.http.get(url).subscribe(res=>{
      // @ts-ignore
      this.newCostGraph = JSON.parse(res).CostGraph;
      this.parseLastDrange();
      this.clearCostGraph();
      this.drawCost();
    })
  }
  getAdaptiveInfo(alg: string):void{
    let url = `http://localhost:8080/adaptive/info?alg=${alg}`
    this.http.get(url).subscribe(res=>{
      // @ts-ignore
      this.test_blocks=JSON.parse(res.blocks).blocks;// @ts-ignore
      this.test_operators = JSON.parse(res.operators).operators;// @ts-ignore
      this.test_body= JSON.parse(res.solution).solution.body;// @ts-ignore
      this.test_preLoop = JSON.parse(res.solution).solution.preLoopConstants;// @ts-ignore
      this.test_origin = JSON.parse(res.root);// @ts-ignore
      this.initial();
    })
  }

  getTime():void{
    let url = `http://localhost:8080/time`;
    this.http.get(url).subscribe(res=>{//@ts-ignore
      this.timeString=res;
      this.parseTime(this.timeString);
      this.drawComparison();
    })
  }

  parseTime(timeString:string):void{
    // console.log(timeString);
    // console.log(`/${this.curAlgorithm}\s+(.*)/g`);
    const pattern = eval(`/${this.curAlgorithm}:\\s+(.*)/g`);
    // const pattern = /dfp:\s+(.*)/g;
    this.times=[];
    for (let i = 0; i < 6; i++) {
      let res:RegExpExecArray = pattern.exec(timeString);
      // @ts-ignore
      this.times.push(res[1]);
    }
  }
  Chart1 = null;
  Chart2 = null;
  isShow = false;
  times = [0,0,0,0,0,0];
  timeString = '';
  curAlgorithm = 'Algorithm';
  curMethod = 'Method';
  curStep = 0;
  isCollapsed = true;
  newCostGraph = [
    {
      "range": {
        "left": 0,
        "right": 0,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 0
          },
          "nodes": [
            {
              "drange": {
                "index": 0
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 1,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 1
          },
          "nodes": [
            {
              "drange": {
                "index": 1
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 2,
        "right": 2,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 2
          },
          "nodes": [
            {
              "drange": {
                "index": 2
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 3,
        "right": 3,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 3
          },
          "nodes": [
            {
              "drange": {
                "index": 3
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 4,
        "right": 4,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 4
          },
          "nodes": [
            {
              "drange": {
                "index": 4
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 5,
        "right": 5,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 5
          },
          "nodes": [
            {
              "drange": {
                "index": 5
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 6,
        "right": 6,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 6
          },
          "nodes": [
            {
              "drange": {
                "index": 6
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 7,
        "right": 7,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 7
          },
          "nodes": [
            {
              "drange": {
                "index": 7
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 8,
        "right": 8,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 8
          },
          "nodes": [
            {
              "drange": {
                "index": 8
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 9,
        "right": 9,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 9
          },
          "nodes": [
            {
              "drange": {
                "index": 9
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 10,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 10
          },
          "nodes": [
            {
              "drange": {
                "index": 10
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 11,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 11
          },
          "nodes": [
            {
              "drange": {
                "index": 11
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 12,
        "right": 12,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 12
          },
          "nodes": [
            {
              "drange": {
                "index": 12
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 13,
        "right": 13,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 13
          },
          "nodes": [
            {
              "drange": {
                "index": 13
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 14,
        "right": 14,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 14
          },
          "nodes": [
            {
              "drange": {
                "index": 14
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 15,
        "right": 15,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 15
          },
          "nodes": [
            {
              "drange": {
                "index": 15
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 16,
        "right": 16,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 16
          },
          "nodes": [
            {
              "drange": {
                "index": 16
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 17,
        "right": 17,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 17
          },
          "nodes": [
            {
              "drange": {
                "index": 17
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 18,
        "right": 18,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 18
          },
          "nodes": [
            {
              "drange": {
                "index": 18
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 19,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 19
          },
          "nodes": [
            {
              "drange": {
                "index": 19
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 20,
        "right": 20,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 20
          },
          "nodes": [
            {
              "drange": {
                "index": 20
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 21,
        "right": 21,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 21
          },
          "nodes": [
            {
              "drange": {
                "index": 21
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 22,
        "right": 22,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 22
          },
          "nodes": [
            {
              "drange": {
                "index": 22
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 23,
        "right": 23,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 23
          },
          "nodes": [
            {
              "drange": {
                "index": 23
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 24,
        "right": 24,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 24
          },
          "nodes": [
            {
              "drange": {
                "index": 24
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 25,
        "right": 25,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 25
          },
          "nodes": [
            {
              "drange": {
                "index": 25
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 26,
        "right": 26,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 26
          },
          "nodes": [
            {
              "drange": {
                "index": 26
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 27,
        "right": 27,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 27
          },
          "nodes": [
            {
              "drange": {
                "index": 27
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 28,
        "right": 28,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 28
          },
          "nodes": [
            {
              "drange": {
                "index": 28
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 29,
        "right": 29,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "index": 29
          },
          "nodes": [
            {
              "drange": {
                "index": 29
              },
              "cses": [],
              "thisCost": 0.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 2,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 1
            },
            "rightRange": {
              "left": 2,
              "right": 2
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 2
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 2,
        "right": 3,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 2
            },
            "rightRange": {
              "left": 3,
              "right": 3
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 2
                },
                "rightRange": {
                  "left": 3,
                  "right": 3
                }
              },
              "cses": [],
              "thisCost": 6.75661024E7,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 2
                },
                "rightRange": {
                  "left": 3,
                  "right": 3
                }
              },
              "cses": [
                {
                  "name": "{t(a) a }",
                  "isConstant": true,
                  "hash": {
                    "left": -629391478303726345,
                    "right": -629391478303726345
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 3,
                      "transpose": false
                    },
                    {
                      "left": 8,
                      "right": 9,
                      "transpose": false
                    },
                    {
                      "left": 13,
                      "right": 14,
                      "transpose": false
                    },
                    {
                      "left": 16,
                      "right": 17,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 27,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1.351322048E-5,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 3,
        "right": 4,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 3,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 4
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 3,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 4
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 4,
        "right": 5,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 5
                }
              },
              "cses": [
                {
                  "name": "{h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -1576245993,
                    "right": -629391466324794088
                  },
                  "ranges": [
                    {
                      "left": 4,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 7,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 12,
                      "transpose": true
                    },
                    {
                      "left": 18,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 20,
                      "right": 21,
                      "transpose": false
                    },
                    {
                      "left": 22,
                      "right": 23,
                      "transpose": true
                    },
                    {
                      "left": 28,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 4.285714285714286,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 5,
        "right": 6,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 5,
              "right": 5
            },
            "rightRange": {
              "left": 6,
              "right": 6
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 5,
                  "right": 5
                },
                "rightRange": {
                  "left": 6,
                  "right": 6
                }
              },
              "cses": [],
              "thisCost": 3.75664024E7,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 6,
        "right": 7,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 7
                }
              },
              "cses": [
                {
                  "name": "{h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -1576245993,
                    "right": -629391466324794088
                  },
                  "ranges": [
                    {
                      "left": 4,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 7,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 12,
                      "transpose": true
                    },
                    {
                      "left": 18,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 20,
                      "right": 21,
                      "transpose": false
                    },
                    {
                      "left": 22,
                      "right": 23,
                      "transpose": true
                    },
                    {
                      "left": 28,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 4.285714285714286,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 7,
        "right": 8,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 7,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 8
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 7,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 8
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 8,
        "right": 9,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 8,
              "right": 8
            },
            "rightRange": {
              "left": 9,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 8,
                  "right": 8
                },
                "rightRange": {
                  "left": 9,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 6.75661024E7,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 8,
                  "right": 8
                },
                "rightRange": {
                  "left": 9,
                  "right": 9
                }
              },
              "cses": [
                {
                  "name": "{t(a) a }",
                  "isConstant": true,
                  "hash": {
                    "left": -629391478303726345,
                    "right": -629391478303726345
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 3,
                      "transpose": false
                    },
                    {
                      "left": 8,
                      "right": 9,
                      "transpose": false
                    },
                    {
                      "left": 13,
                      "right": 14,
                      "transpose": false
                    },
                    {
                      "left": 16,
                      "right": 17,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 27,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1.351322048E-5,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 9,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 9,
              "right": 9
            },
            "rightRange": {
              "left": 10,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 9,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 12,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 11
            },
            "rightRange": {
              "left": 12,
              "right": 12
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 11
                },
                "rightRange": {
                  "left": 12,
                  "right": 12
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 11
                },
                "rightRange": {
                  "left": 12,
                  "right": 12
                }
              },
              "cses": [
                {
                  "name": "{h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -1576245993,
                    "right": -629391466324794088
                  },
                  "ranges": [
                    {
                      "left": 4,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 7,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 12,
                      "transpose": true
                    },
                    {
                      "left": 18,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 20,
                      "right": 21,
                      "transpose": false
                    },
                    {
                      "left": 22,
                      "right": 23,
                      "transpose": true
                    },
                    {
                      "left": 28,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 4.285714285714286,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 12,
        "right": 13,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 12,
              "right": 12
            },
            "rightRange": {
              "left": 13,
              "right": 13
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 12,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 13
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 13,
        "right": 14,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 13,
              "right": 13
            },
            "rightRange": {
              "left": 14,
              "right": 14
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 13,
                  "right": 13
                },
                "rightRange": {
                  "left": 14,
                  "right": 14
                }
              },
              "cses": [],
              "thisCost": 6.75661024E7,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 13,
                  "right": 13
                },
                "rightRange": {
                  "left": 14,
                  "right": 14
                }
              },
              "cses": [
                {
                  "name": "{t(a) a }",
                  "isConstant": true,
                  "hash": {
                    "left": -629391478303726345,
                    "right": -629391478303726345
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 3,
                      "transpose": false
                    },
                    {
                      "left": 8,
                      "right": 9,
                      "transpose": false
                    },
                    {
                      "left": 13,
                      "right": 14,
                      "transpose": false
                    },
                    {
                      "left": 16,
                      "right": 17,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 27,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1.351322048E-5,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 14,
        "right": 15,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 14,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 15
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 14,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 15
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 15,
        "right": 16,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 15,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 16
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 15,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 16
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 16,
        "right": 17,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 16,
              "right": 16
            },
            "rightRange": {
              "left": 17,
              "right": 17
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 16
                },
                "rightRange": {
                  "left": 17,
                  "right": 17
                }
              },
              "cses": [],
              "thisCost": 6.75661024E7,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 16
                },
                "rightRange": {
                  "left": 17,
                  "right": 17
                }
              },
              "cses": [
                {
                  "name": "{t(a) a }",
                  "isConstant": true,
                  "hash": {
                    "left": -629391478303726345,
                    "right": -629391478303726345
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 3,
                      "transpose": false
                    },
                    {
                      "left": 8,
                      "right": 9,
                      "transpose": false
                    },
                    {
                      "left": 13,
                      "right": 14,
                      "transpose": false
                    },
                    {
                      "left": 16,
                      "right": 17,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 27,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1.351322048E-5,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 17,
        "right": 18,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 17,
              "right": 17
            },
            "rightRange": {
              "left": 18,
              "right": 18
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 17,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 18
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 18,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 18,
              "right": 18
            },
            "rightRange": {
              "left": 19,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 18,
                  "right": 18
                },
                "rightRange": {
                  "left": 19,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 18,
                  "right": 18
                },
                "rightRange": {
                  "left": 19,
                  "right": 19
                }
              },
              "cses": [
                {
                  "name": "{h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -1576245993,
                    "right": -629391466324794088
                  },
                  "ranges": [
                    {
                      "left": 4,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 7,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 12,
                      "transpose": true
                    },
                    {
                      "left": 18,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 20,
                      "right": 21,
                      "transpose": false
                    },
                    {
                      "left": 22,
                      "right": 23,
                      "transpose": true
                    },
                    {
                      "left": 28,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 4.285714285714286,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 20,
        "right": 21,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 20,
              "right": 20
            },
            "rightRange": {
              "left": 21,
              "right": 21
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 20,
                  "right": 20
                },
                "rightRange": {
                  "left": 21,
                  "right": 21
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 20,
                  "right": 20
                },
                "rightRange": {
                  "left": 21,
                  "right": 21
                }
              },
              "cses": [
                {
                  "name": "{h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -1576245993,
                    "right": -629391466324794088
                  },
                  "ranges": [
                    {
                      "left": 4,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 7,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 12,
                      "transpose": true
                    },
                    {
                      "left": 18,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 20,
                      "right": 21,
                      "transpose": false
                    },
                    {
                      "left": 22,
                      "right": 23,
                      "transpose": true
                    },
                    {
                      "left": 28,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 4.285714285714286,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 21,
        "right": 22,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 21,
              "right": 21
            },
            "rightRange": {
              "left": 22,
              "right": 22
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 21,
                  "right": 21
                },
                "rightRange": {
                  "left": 22,
                  "right": 22
                }
              },
              "cses": [],
              "thisCost": 3.75664024E7,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 22,
        "right": 23,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 22,
              "right": 22
            },
            "rightRange": {
              "left": 23,
              "right": 23
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 22,
                  "right": 22
                },
                "rightRange": {
                  "left": 23,
                  "right": 23
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 22,
                  "right": 22
                },
                "rightRange": {
                  "left": 23,
                  "right": 23
                }
              },
              "cses": [
                {
                  "name": "{h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -1576245993,
                    "right": -629391466324794088
                  },
                  "ranges": [
                    {
                      "left": 4,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 7,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 12,
                      "transpose": true
                    },
                    {
                      "left": 18,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 20,
                      "right": 21,
                      "transpose": false
                    },
                    {
                      "left": 22,
                      "right": 23,
                      "transpose": true
                    },
                    {
                      "left": 28,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 4.285714285714286,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 24,
        "right": 25,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 24
            },
            "rightRange": {
              "left": 25,
              "right": 25
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 24
                },
                "rightRange": {
                  "left": 25,
                  "right": 25
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 25,
        "right": 26,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 25,
              "right": 25
            },
            "rightRange": {
              "left": 26,
              "right": 26
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 25
                },
                "rightRange": {
                  "left": 26,
                  "right": 26
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 26,
        "right": 27,
        "transpose": false,
        "isConstant": true
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 26,
              "right": 26
            },
            "rightRange": {
              "left": 27,
              "right": 27
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 26
                },
                "rightRange": {
                  "left": 27,
                  "right": 27
                }
              },
              "cses": [],
              "thisCost": 6.75661024E7,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 26
                },
                "rightRange": {
                  "left": 27,
                  "right": 27
                }
              },
              "cses": [
                {
                  "name": "{t(a) a }",
                  "isConstant": true,
                  "hash": {
                    "left": -629391478303726345,
                    "right": -629391478303726345
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 3,
                      "transpose": false
                    },
                    {
                      "left": 8,
                      "right": 9,
                      "transpose": false
                    },
                    {
                      "left": 13,
                      "right": 14,
                      "transpose": false
                    },
                    {
                      "left": 16,
                      "right": 17,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 27,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1.351322048E-5,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 27,
        "right": 28,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 27,
              "right": 27
            },
            "rightRange": {
              "left": 28,
              "right": 28
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 27,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 28
                }
              },
              "cses": [],
              "thisCost": 3000000.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 28,
        "right": 29,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 28,
              "right": 28
            },
            "rightRange": {
              "left": 29,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 28,
                  "right": 28
                },
                "rightRange": {
                  "left": 29,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 28,
                  "right": 28
                },
                "rightRange": {
                  "left": 29,
                  "right": 29
                }
              },
              "cses": [
                {
                  "name": "{h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -1576245993,
                    "right": -629391466324794088
                  },
                  "ranges": [
                    {
                      "left": 4,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 7,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 12,
                      "transpose": true
                    },
                    {
                      "left": 18,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 20,
                      "right": 21,
                      "transpose": false
                    },
                    {
                      "left": 22,
                      "right": 23,
                      "transpose": true
                    },
                    {
                      "left": 28,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 4.285714285714286,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 3,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 1
            },
            "rightRange": {
              "left": 2,
              "right": 3
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 3
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 2,
        "right": 4,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 4
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 4
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 3,
        "right": 5,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 3,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 3,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 1953966.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 3,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 3,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 2100000.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 4,
        "right": 6,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 5
            },
            "rightRange": {
              "left": 6,
              "right": 6
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 5
                },
                "rightRange": {
                  "left": 6,
                  "right": 6
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 6
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 6
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 5,
        "right": 7,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 5,
              "right": 5
            },
            "rightRange": {
              "left": 6,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 5,
                  "right": 5
                },
                "rightRange": {
                  "left": 6,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 5,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 5,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 6,
        "right": 8,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 8
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 8
                }
              },
              "cses": [],
              "thisCost": 1953966.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 8
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 8
                }
              },
              "cses": [],
              "thisCost": 2100000.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 7,
        "right": 9,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 7,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 7,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 8,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 8,
              "right": 9
            },
            "rightRange": {
              "left": 10,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 8,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 13,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 12
            },
            "rightRange": {
              "left": 13,
              "right": 13
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 13
                }
              },
              "cses": [],
              "thisCost": 2100000.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 11
            },
            "rightRange": {
              "left": 12,
              "right": 13
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 11
                },
                "rightRange": {
                  "left": 12,
                  "right": 13
                }
              },
              "cses": [],
              "thisCost": 1953966.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 12,
        "right": 14,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 12,
              "right": 12
            },
            "rightRange": {
              "left": 13,
              "right": 14
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 12,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 14
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 13,
        "right": 15,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 13,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 15
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 13,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 15
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 15,
        "right": 17,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 15,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 17
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 15,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 17
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 16,
        "right": 18,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 16,
              "right": 17
            },
            "rightRange": {
              "left": 18,
              "right": 18
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 18
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 17,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 17,
              "right": 17
            },
            "rightRange": {
              "left": 18,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 17,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 2100000.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 17,
              "right": 18
            },
            "rightRange": {
              "left": 19,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 17,
                  "right": 18
                },
                "rightRange": {
                  "left": 19,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 1953966.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 20,
        "right": 22,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 20,
              "right": 21
            },
            "rightRange": {
              "left": 22,
              "right": 22
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 20,
                  "right": 21
                },
                "rightRange": {
                  "left": 22,
                  "right": 22
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 20,
              "right": 20
            },
            "rightRange": {
              "left": 21,
              "right": 22
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 20,
                  "right": 20
                },
                "rightRange": {
                  "left": 21,
                  "right": 22
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 21,
        "right": 23,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 21,
              "right": 22
            },
            "rightRange": {
              "left": 23,
              "right": 23
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 21,
                  "right": 22
                },
                "rightRange": {
                  "left": 23,
                  "right": 23
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 21,
              "right": 21
            },
            "rightRange": {
              "left": 22,
              "right": 23
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 21,
                  "right": 21
                },
                "rightRange": {
                  "left": 22,
                  "right": 23
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 24,
        "right": 26,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 24
            },
            "rightRange": {
              "left": 25,
              "right": 26
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 24
                },
                "rightRange": {
                  "left": 25,
                  "right": 26
                }
              },
              "cses": [],
              "thisCost": 1953966.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 25
            },
            "rightRange": {
              "left": 26,
              "right": 26
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 25
                },
                "rightRange": {
                  "left": 26,
                  "right": 26
                }
              },
              "cses": [],
              "thisCost": 2100000.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 25,
        "right": 27,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 25,
              "right": 25
            },
            "rightRange": {
              "left": 26,
              "right": 27
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 25
                },
                "rightRange": {
                  "left": 26,
                  "right": 27
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 26,
        "right": 28,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 26,
              "right": 27
            },
            "rightRange": {
              "left": 28,
              "right": 28
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 28
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 27,
        "right": 29,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 27,
              "right": 27
            },
            "rightRange": {
              "left": 28,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 27,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 2100000.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 27,
              "right": 28
            },
            "rightRange": {
              "left": 29,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 27,
                  "right": 28
                },
                "rightRange": {
                  "left": 29,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 1953966.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 4,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 4
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 4
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 1
            },
            "rightRange": {
              "left": 2,
              "right": 4
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 4
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 2,
        "right": 5,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 5
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 39.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 5
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 42.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 2
            },
            "rightRange": {
              "left": 3,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 2
                },
                "rightRange": {
                  "left": 3,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 6793507.68,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 2
                },
                "rightRange": {
                  "left": 3,
                  "right": 5
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1358701.5359999998,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 4,
        "right": 7,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 5
            },
            "rightRange": {
              "left": 6,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 5
                },
                "rightRange": {
                  "left": 6,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 147.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 6,
        "right": 9,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 9
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 39.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 9
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 42.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 8
            },
            "rightRange": {
              "left": 9,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 8
                },
                "rightRange": {
                  "left": 9,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 6793507.68,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 8
                },
                "rightRange": {
                  "left": 9,
                  "right": 9
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1358701.5359999998,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 7,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 7,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 7,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 7,
              "right": 9
            },
            "rightRange": {
              "left": 10,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 7,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 14,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 12
            },
            "rightRange": {
              "left": 13,
              "right": 14
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 14
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 14
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 42.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 11
            },
            "rightRange": {
              "left": 12,
              "right": 14
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 11
                },
                "rightRange": {
                  "left": 12,
                  "right": 14
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 11
                },
                "rightRange": {
                  "left": 12,
                  "right": 14
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 39.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 13
            },
            "rightRange": {
              "left": 14,
              "right": 14
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 13
                },
                "rightRange": {
                  "left": 14,
                  "right": 14
                }
              },
              "cses": [],
              "thisCost": 6793507.68,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 13
                },
                "rightRange": {
                  "left": 14,
                  "right": 14
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1358701.5359999998,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 12,
        "right": 15,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 12,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 15
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 12,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 15
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 15,
        "right": 18,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 15,
              "right": 17
            },
            "rightRange": {
              "left": 18,
              "right": 18
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 15,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 18
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 16,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 16,
              "right": 18
            },
            "rightRange": {
              "left": 19,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 18
                },
                "rightRange": {
                  "left": 19,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 18
                },
                "rightRange": {
                  "left": 19,
                  "right": 19
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 39.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 16,
              "right": 17
            },
            "rightRange": {
              "left": 18,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 19
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 42.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 16,
              "right": 16
            },
            "rightRange": {
              "left": 17,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 16
                },
                "rightRange": {
                  "left": 17,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 6793507.68,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 16,
                  "right": 16
                },
                "rightRange": {
                  "left": 17,
                  "right": 19
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1358701.5359999998,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 20,
        "right": 23,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 20,
              "right": 22
            },
            "rightRange": {
              "left": 23,
              "right": 23
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 20,
                  "right": 22
                },
                "rightRange": {
                  "left": 23,
                  "right": 23
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 20,
              "right": 21
            },
            "rightRange": {
              "left": 22,
              "right": 23
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 20,
                  "right": 21
                },
                "rightRange": {
                  "left": 22,
                  "right": 23
                }
              },
              "cses": [],
              "thisCost": 147.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 20,
              "right": 20
            },
            "rightRange": {
              "left": 21,
              "right": 23
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 20,
                  "right": 20
                },
                "rightRange": {
                  "left": 21,
                  "right": 23
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 24,
        "right": 27,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 24
            },
            "rightRange": {
              "left": 25,
              "right": 27
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 24
                },
                "rightRange": {
                  "left": 25,
                  "right": 27
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 26
            },
            "rightRange": {
              "left": 27,
              "right": 27
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 26
                },
                "rightRange": {
                  "left": 27,
                  "right": 27
                }
              },
              "cses": [],
              "thisCost": 6793507.68,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 25
            },
            "rightRange": {
              "left": 26,
              "right": 27
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 25
                },
                "rightRange": {
                  "left": 26,
                  "right": 27
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 25,
        "right": 28,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 25,
              "right": 27
            },
            "rightRange": {
              "left": 28,
              "right": 28
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 28
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 26,
        "right": 29,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 26,
              "right": 27
            },
            "rightRange": {
              "left": 28,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 29
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 42.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 26,
              "right": 28
            },
            "rightRange": {
              "left": 29,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 28
                },
                "rightRange": {
                  "left": 29,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 28
                },
                "rightRange": {
                  "left": 29,
                  "right": 29
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 39.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 26,
              "right": 26
            },
            "rightRange": {
              "left": 27,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 26
                },
                "rightRange": {
                  "left": 27,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 6793507.68,
              "isConstant": true
            },
            {
              "drange": {
                "leftRange": {
                  "left": 26,
                  "right": 26
                },
                "rightRange": {
                  "left": 27,
                  "right": 29
                }
              },
              "cses": [
                {
                  "name": "{t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -629391482086716728,
                    "right": -2202870161926485348
                  },
                  "ranges": [
                    {
                      "left": 2,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 9,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 14,
                      "transpose": true
                    },
                    {
                      "left": 16,
                      "right": 19,
                      "transpose": false
                    },
                    {
                      "left": 26,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 1358701.5359999998,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 5,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 136.5,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 5
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 34.125,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 147.00000000000003,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 5
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 36.75000000000001,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 1
            },
            "rightRange": {
              "left": 2,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 5
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 7.5,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 2
            },
            "rightRange": {
              "left": 3,
              "right": 5
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 2
                },
                "rightRange": {
                  "left": 3,
                  "right": 5
                }
              },
              "cses": [],
              "thisCost": 3647454.1403400004,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 2
                },
                "rightRange": {
                  "left": 3,
                  "right": 5
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 911863.5350850001,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 2,
        "right": 6,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 6
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 6
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 6
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 6
                }
              },
              "cses": [],
              "thisCost": 2100.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 5,
        "right": 9,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 5,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 5,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 5,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 5,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 2100.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 6,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 147.00000000000003,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 10
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 36.75000000000001,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 136.5,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 10
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 34.125,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 8
            },
            "rightRange": {
              "left": 9,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 8
                },
                "rightRange": {
                  "left": 9,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 3647454.1403400004,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 8
                },
                "rightRange": {
                  "left": 9,
                  "right": 10
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 911863.5350850001,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 6,
              "right": 9
            },
            "rightRange": {
              "left": 10,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 6,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 7.5,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 15,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 15
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 15
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 15
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 7.5,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 13
            },
            "rightRange": {
              "left": 14,
              "right": 15
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 13
                },
                "rightRange": {
                  "left": 14,
                  "right": 15
                }
              },
              "cses": [],
              "thisCost": 3647454.1403400004,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 13
                },
                "rightRange": {
                  "left": 14,
                  "right": 15
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 911863.5350850001,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 12
            },
            "rightRange": {
              "left": 13,
              "right": 15
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 15
                }
              },
              "cses": [],
              "thisCost": 136.5,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 15
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 34.125,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 11
            },
            "rightRange": {
              "left": 12,
              "right": 15
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 11
                },
                "rightRange": {
                  "left": 12,
                  "right": 15
                }
              },
              "cses": [],
              "thisCost": 147.00000000000003,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 11
                },
                "rightRange": {
                  "left": 12,
                  "right": 15
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 36.75000000000001,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 15,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 15,
              "right": 16
            },
            "rightRange": {
              "left": 17,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 15,
                  "right": 16
                },
                "rightRange": {
                  "left": 17,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 3647454.1403400004,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 15,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 15,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 15,
              "right": 18
            },
            "rightRange": {
              "left": 19,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 15,
                  "right": 18
                },
                "rightRange": {
                  "left": 19,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 147.00000000000003,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 15,
              "right": 17
            },
            "rightRange": {
              "left": 18,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 15,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 136.5,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 24,
        "right": 28,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 24
            },
            "rightRange": {
              "left": 25,
              "right": 28
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 24
                },
                "rightRange": {
                  "left": 25,
                  "right": 28
                }
              },
              "cses": [],
              "thisCost": 147.00000000000003,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 26
            },
            "rightRange": {
              "left": 27,
              "right": 28
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 26
                },
                "rightRange": {
                  "left": 27,
                  "right": 28
                }
              },
              "cses": [],
              "thisCost": 3647454.1403400004,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 25
            },
            "rightRange": {
              "left": 26,
              "right": 28
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 25
                },
                "rightRange": {
                  "left": 26,
                  "right": 28
                }
              },
              "cses": [],
              "thisCost": 136.5,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 27
            },
            "rightRange": {
              "left": 28,
              "right": 28
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 28
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 25,
        "right": 29,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 25,
              "right": 26
            },
            "rightRange": {
              "left": 27,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 26
                },
                "rightRange": {
                  "left": 27,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 3647454.1403400004,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 26
                },
                "rightRange": {
                  "left": 27,
                  "right": 29
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 911863.5350850001,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 25,
              "right": 25
            },
            "rightRange": {
              "left": 26,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 25
                },
                "rightRange": {
                  "left": 26,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 25
                },
                "rightRange": {
                  "left": 26,
                  "right": 29
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 7.5,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 25,
              "right": 28
            },
            "rightRange": {
              "left": 29,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 28
                },
                "rightRange": {
                  "left": 29,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 147.00000000000003,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 28
                },
                "rightRange": {
                  "left": 29,
                  "right": 29
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 36.75000000000001,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 25,
              "right": 27
            },
            "rightRange": {
              "left": 28,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 136.5,
              "isConstant": false
            },
            {
              "drange": {
                "leftRange": {
                  "left": 25,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 29
                }
              },
              "cses": [
                {
                  "name": "{h t(a) a h g }",
                  "isConstant": false,
                  "hash": {
                    "left": -944087223918198091,
                    "right": -2202870165394226526
                  },
                  "ranges": [
                    {
                      "left": 1,
                      "right": 5,
                      "transpose": false
                    },
                    {
                      "left": 6,
                      "right": 10,
                      "transpose": true
                    },
                    {
                      "left": 11,
                      "right": 15,
                      "transpose": true
                    },
                    {
                      "left": 25,
                      "right": 29,
                      "transpose": false
                    }
                  ]
                }
              ],
              "thisCost": 34.125,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 6,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 6
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 6
                }
              },
              "cses": [],
              "thisCost": 1364.9999999999998,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 6
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 6
                }
              },
              "cses": [],
              "thisCost": 1470.0000000000002,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 1
            },
            "rightRange": {
              "left": 2,
              "right": 6
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 6
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 2,
        "right": 7,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 1364.9999999999998,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 1470.0000000000002,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 4,
        "right": 9,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1365.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1470.0000000000002,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 5,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 5,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 5,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1470.0000000000002,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 5,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 5,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1365.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 5,
              "right": 9
            },
            "rightRange": {
              "left": 10,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 5,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 16,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 16
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 16
                }
              },
              "cses": [],
              "thisCost": 2100000.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 16
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 16
                }
              },
              "cses": [],
              "thisCost": 1953966.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 14,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 14,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 14,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 2100000.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 14,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 14,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 1953966.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 24,
        "right": 29,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 24
            },
            "rightRange": {
              "left": 25,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 24
                },
                "rightRange": {
                  "left": 25,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 25
            },
            "rightRange": {
              "left": 26,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 25
                },
                "rightRange": {
                  "left": 26,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 28
            },
            "rightRange": {
              "left": 29,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 28
                },
                "rightRange": {
                  "left": 29,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 24,
              "right": 27
            },
            "rightRange": {
              "left": 28,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 24,
                  "right": 27
                },
                "rightRange": {
                  "left": 28,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 7,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 955.5000000000002,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 1029.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 1
            },
            "rightRange": {
              "left": 2,
              "right": 7
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 7
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 4,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1029.0000000000002,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 955.5000000000002,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 4,
              "right": 9
            },
            "rightRange": {
              "left": 10,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 4,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 17,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 16
            },
            "rightRange": {
              "left": 17,
              "right": 17
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 16
                },
                "rightRange": {
                  "left": 17,
                  "right": 17
                }
              },
              "cses": [],
              "thisCost": 4693477.68,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 17
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 17
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 17
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 17
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 13,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 13,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 13,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 13,
              "right": 13
            },
            "rightRange": {
              "left": 14,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 13,
                  "right": 13
                },
                "rightRange": {
                  "left": 14,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 6793507.68,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 13,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 13,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 210.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 2,
        "right": 9,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 3000.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 18,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 17
            },
            "rightRange": {
              "left": 18,
              "right": 18
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 18
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 16
            },
            "rightRange": {
              "left": 17,
              "right": 18
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 16
                },
                "rightRange": {
                  "left": 17,
                  "right": 18
                }
              },
              "cses": [],
              "thisCost": 3647454.1403399995,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 18
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 18
                }
              },
              "cses": [],
              "thisCost": 136.5,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 18
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 18
                }
              },
              "cses": [],
              "thisCost": 147.00000000000003,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 12,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 12,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 12,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 147.00000000000003,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 12,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 12,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 136.5,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 12,
              "right": 13
            },
            "rightRange": {
              "left": 14,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 12,
                  "right": 13
                },
                "rightRange": {
                  "left": 14,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 3647454.1403400004,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 12,
              "right": 12
            },
            "rightRange": {
              "left": 13,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 12,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 30.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 9,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 1470.0000000000002,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 1
            },
            "rightRange": {
              "left": 2,
              "right": 9
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 9
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 2,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 9
            },
            "rightRange": {
              "left": 10,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1267.5,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1470.0000000000002,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1267.5,
              "isConstant": true
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 2,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 2,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1950.0,
              "isConstant": true
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 11,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 14
            },
            "rightRange": {
              "left": 15,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 14
                },
                "rightRange": {
                  "left": 15,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 12
            },
            "rightRange": {
              "left": 13,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 12
                },
                "rightRange": {
                  "left": 13,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 11
            },
            "rightRange": {
              "left": 12,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 11
                },
                "rightRange": {
                  "left": 12,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 18
            },
            "rightRange": {
              "left": 19,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 18
                },
                "rightRange": {
                  "left": 19,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 17
            },
            "rightRange": {
              "left": 18,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 17
                },
                "rightRange": {
                  "left": 18,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 11,
              "right": 15
            },
            "rightRange": {
              "left": 16,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 11,
                  "right": 15
                },
                "rightRange": {
                  "left": 16,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 21.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 10,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 9
            },
            "rightRange": {
              "left": 10,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 9
                },
                "rightRange": {
                  "left": 10,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 300.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 7
            },
            "rightRange": {
              "left": 8,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 7
                },
                "rightRange": {
                  "left": 8,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1267.5,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 5
            },
            "rightRange": {
              "left": 6,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 5
                },
                "rightRange": {
                  "left": 6,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 147.0,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 6
            },
            "rightRange": {
              "left": 7,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 6
                },
                "rightRange": {
                  "left": 7,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1470.0000000000002,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 3
            },
            "rightRange": {
              "left": 4,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 3
                },
                "rightRange": {
                  "left": 4,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 1267.5,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 4
            },
            "rightRange": {
              "left": 5,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 4
                },
                "rightRange": {
                  "left": 5,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 955.5000000000002,
              "isConstant": false
            }
          ]
        },
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 1
            },
            "rightRange": {
              "left": 2,
              "right": 10
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 1
                },
                "rightRange": {
                  "left": 2,
                  "right": 10
                }
              },
              "cses": [],
              "thisCost": 195.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 20,
        "right": 29,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 20,
              "right": 23
            },
            "rightRange": {
              "left": 24,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 20,
                  "right": 23
                },
                "rightRange": {
                  "left": 24,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 98.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 1,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 1,
              "right": 10
            },
            "rightRange": {
              "left": 11,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 1,
                  "right": 10
                },
                "rightRange": {
                  "left": 11,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 98.0,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 0,
        "right": 19,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 0,
              "right": 0
            },
            "rightRange": {
              "left": 1,
              "right": 19
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 0,
                  "right": 0
                },
                "rightRange": {
                  "left": 1,
                  "right": 19
                }
              },
              "cses": [],
              "thisCost": 7.51322638E7,
              "isConstant": false
            }
          ]
        }
      ]
    },
    {
      "range": {
        "left": 0,
        "right": 29,
        "transpose": false,
        "isConstant": false
      },
      "drangeNodes": [
        {
          "drange": {
            "leftRange": {
              "left": 0,
              "right": 19
            },
            "rightRange": {
              "left": 20,
              "right": 29
            }
          },
          "nodes": [
            {
              "drange": {
                "leftRange": {
                  "left": 0,
                  "right": 19
                },
                "rightRange": {
                  "left": 20,
                  "right": 29
                }
              },
              "cses": [],
              "thisCost": 7.51323078E7,
              "isConstant": false
            }
          ]
        }
      ]
    }
  ];
  costGraphNodes = {};
  variables = ['H', 'H', 'Aᵀ', 'Aᵀ', 'H', 'g', 'gᵀ', 'Hᵀ', 'Aᵀ', 'A', 'H', 'gᵀ', 'Hᵀ', 'Aᵀ'];
  operators = ['-', '∙', '∙', '∙', '∙', '∙', '∙', '∙', '∙', '∙', '/', '∙', '∙', ''];
  splits = [[0, 0], [1, 10], [11, 13]];
  test_blocks= [
    {
      "range": {
        "left": 0,
        "right": 0,
        "transpose": false
      },
      "name": "{H }"
    },
    {
      "range": {
        "left": 1,
        "right": 10,
        "transpose": false
      },
      "name": "{H t(A) A H g t(g) t(H) t(A) A H }"
    },
    {
      "range": {
        "left": 11,
        "right": 19,
        "transpose": false
      },
      "name": "{t(g) t(H) t(A) A H t(A) A H g }"
    },
    {
      "range": {
        "left": 20,
        "right": 23,
        "transpose": false
      },
      "name": "{H g t(g) t(H) }"
    },
    {
      "range": {
        "left": 24,
        "right": 29,
        "transpose": false
      },
      "name": "{t(g) t(H) t(A) A H g }"
    }
  ];
  test_operators=[
    "-",
    "*",
    "*",
    "*",
    "*",
    "*",
    "*",
    "*",
    "*",
    "*",
    "/",
    "*",
    "*",
    "*",
    "*",
    "*",
    "*",
    "*",
    "*",
    "+",
    "*",
    "*",
    "*",
    "/",
    "*",
    "*",
    "*",
    "*",
    "*"
  ];
  dranges = [];
  test_body = {
    "nodes": {
      "hopID": 467988,
      "name": "H",
      "reference": false,
      "children": [
        {
          "hopID": 467989,
          "name": "+",
          "reference": false,
          "children": [
            {
              "hopID": 467990,
              "name": "-",
              "reference": false,
              "children": [
                {
                  "hopID": 467991,
                  "name": "H",
                  "reference": false,
                  "children": []
                },
                {
                  "hopID": 467992,
                  "name": "/",
                  "reference": false,
                  "children": [
                    {
                      "hopID": 467993,
                      "name": "*",
                      "reference": false,
                      "children": [
                        {
                          "hopID": 467994,
                          "name": "*",
                          "reference": false,
                          "children": [
                            {
                              "hopID": 467991,
                              "reference": false,
                              "name": "H",
                              "children": []
                            },
                            {
                              "hopID": 467995,
                              "name": "*",
                              "reference": false,
                              "children": [
                                {
                                  "hopID": 468014,
                                  "name": "_conVar467996",
                                  "reference": false,
                                  "children": []
                                },
                                {
                                  "hopID": 467999,
                                  "name": "*",
                                  "reference": false,
                                  "children": [
                                    {
                                      "hopID": 467991,
                                      "reference": false,
                                      "name": "H",
                                      "children": []
                                    },
                                    {
                                      "hopID": 468000,
                                      "name": "g",
                                      "reference": false,
                                      "children": []
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "hopID": 468001,
                          "name": "t",
                          "reference": false,
                          "children": [
                            {
                              "hopID": 467994,
                              "reference": true,
                              "name": "*",
                              "children": []
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "hopID": 468002,
                      "name": "cast",
                      "reference": false,
                      "children": [
                        {
                          "hopID": 468003,
                          "name": "*",
                          "reference": false,
                          "children": [
                            {
                              "hopID": 468001,
                              "reference": true,
                              "name": "t",
                              "children": []
                            },
                            {
                              "hopID": 467995,
                              "reference": true,
                              "name": "*",
                              "children": []
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "hopID": 468005,
              "name": "/",
              "reference": false,
              "children": [
                {
                  "hopID": 468006,
                  "name": "*",
                  "reference": false,
                  "children": [
                    {
                      "hopID": 467999,
                      "reference": true,
                      "name": "*",
                      "children": []
                    },
                    {
                      "hopID": 468007,
                      "name": "t",
                      "reference": false,
                      "children": [
                        {
                          "hopID": 467999,
                          "reference": true,
                          "name": "*",
                          "children": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "hopID": 468009,
                  "name": "cast",
                  "reference": false,
                  "children": [
                    {
                      "hopID": 468010,
                      "name": "*",
                      "reference": false,
                      "children": [
                        {
                          "hopID": 468011,
                          "name": "t",
                          "reference": false,
                          "children": [
                            {
                              "hopID": 468000,
                              "reference": false,
                              "name": "g",
                              "children": []
                            }
                          ]
                        },
                        {
                          "hopID": 467994,
                          "reference": true,
                          "name": "*",
                          "children": []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  };
  test_origin = {
    "nodes": {
      "hopID": 469,
      "name": "H",
      "reference": false,
      "children": [
        {
          "hopID": 470,
          "name": "+",
          "reference": false,
          "children": [
            {
              "hopID": 471,
              "name": "-",
              "reference": false,
              "children": [
                {
                  "hopID": 472,
                  "name": "H",
                  "reference": false,
                  "children": []
                },
                {
                  "hopID": 473,
                  "name": "/",
                  "reference": false,
                  "children": [
                    {
                      "hopID": 474,
                      "name": "*",
                      "reference": false,
                      "children": [
                        {
                          "hopID": 475,
                          "name": "*",
                          "reference": false,
                          "children": [
                            {
                              "hopID": 472,
                              "reference": false,
                              "name": "H",
                              "children": []
                            },
                            {
                              "hopID": 476,
                              "name": "*",
                              "reference": false,
                              "children": [
                                {
                                  "hopID": 477,
                                  "name": "t",
                                  "reference": false,
                                  "children": [
                                    {
                                      "hopID": 478,
                                      "name": "A",
                                      "reference": false,
                                      "children": []
                                    }
                                  ]
                                },
                                {
                                  "hopID": 479,
                                  "name": "*",
                                  "reference": false,
                                  "children": [
                                    {
                                      "hopID": 478,
                                      "reference": false,
                                      "name": "A",
                                      "children": []
                                    },
                                    {
                                      "hopID": 480,
                                      "name": "*",
                                      "reference": false,
                                      "children": [
                                        {
                                          "hopID": 472,
                                          "reference": false,
                                          "name": "H",
                                          "children": []
                                        },
                                        {
                                          "hopID": 481,
                                          "name": "g",
                                          "reference": false,
                                          "children": []
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          "hopID": 482,
                          "name": "*",
                          "reference": false,
                          "children": [
                            {
                              "hopID": 483,
                              "name": "*",
                              "reference": false,
                              "children": [
                                {
                                  "hopID": 484,
                                  "name": "*",
                                  "reference": false,
                                  "children": [
                                    {
                                      "hopID": 485,
                                      "name": "t",
                                      "reference": false,
                                      "children": [
                                        {
                                          "hopID": 480,
                                          "reference": true,
                                          "name": "*",
                                          "children": []
                                        }
                                      ]
                                    },
                                    {
                                      "hopID": 477,
                                      "reference": true,
                                      "name": "t",
                                      "children": []
                                    }
                                  ]
                                },
                                {
                                  "hopID": 478,
                                  "reference": false,
                                  "name": "A",
                                  "children": []
                                }
                              ]
                            },
                            {
                              "hopID": 472,
                              "reference": false,
                              "name": "H",
                              "children": []
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "hopID": 486,
                      "name": "cast",
                      "reference": false,
                      "children": [
                        {
                          "hopID": 487,
                          "name": "*",
                          "reference": false,
                          "children": [
                            {
                              "hopID": 483,
                              "reference": true,
                              "name": "*",
                              "children": []
                            },
                            {
                              "hopID": 475,
                              "reference": true,
                              "name": "*",
                              "children": []
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "hopID": 488,
              "name": "/",
              "reference": false,
              "children": [
                {
                  "hopID": 489,
                  "name": "*",
                  "reference": false,
                  "children": [
                    {
                      "hopID": 480,
                      "reference": true,
                      "name": "*",
                      "children": []
                    },
                    {
                      "hopID": 485,
                      "reference": true,
                      "name": "t",
                      "children": []
                    }
                  ]
                },
                {
                  "hopID": 491,
                  "name": "cast",
                  "reference": false,
                  "children": [
                    {
                      "hopID": 492,
                      "name": "*",
                      "reference": false,
                      "children": [
                        {
                          "hopID": 483,
                          "reference": true,
                          "name": "*",
                          "children": []
                        },
                        {
                          "hopID": 480,
                          "reference": true,
                          "name": "*",
                          "children": []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  };
  test_preLoop= [
    {
      "nodes": {
        "hopID": 468013,
        "name": "_conVar467996",
        "reference": false,
        "children": [
          {
            "hopID": 467996,
            "name": "*",
            "reference": false,
            "children": [
              {
                "hopID": 467997,
                "name": "𝑇",
                "reference": false,
                "children": [
                  {
                    "hopID": 467998,
                    "name": "A",
                    "reference": false,
                    "children": []
                  }
                ]
              },
              {
                "hopID": 467998,
                "reference": false,
                "name": "A",
                "children": []
              }
            ]
          }
        ]
      }
    }
  ];
  constructor(private http:HttpClient) {
  }

  ngOnInit(): void {
    // this.getStepCostGraph(1,"bfgs","criteo1");
    // this.getAdaptiveInfo("bfgs","criteo1");
  }

  submitRequest() {
    this.getAdaptiveInfo(this.curAlgorithm);
    this.getStepCostGraph(this.curStep,this.curAlgorithm);
    this.getTime();
  }
}
