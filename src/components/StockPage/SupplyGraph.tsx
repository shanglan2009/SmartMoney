"use client";

import { useEffect, useRef } from "react";
import type { SupplyGraph } from "@/lib/types";
import * as d3 from "d3";

interface Props {
  graph: SupplyGraph;
}

export default function SupplyGraphComponent({ graph }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 500;
    const height = 350;

    // Cast to any for D3 compatibility
    const nodes: any = graph.nodes;
    const edges: any = graph.edges;

    // Create a force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(edges).id((d: any) => d.id).distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const container = svg.append("g");

    // Arrow marker
    container
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    // Links
    const link = container
      .append("g")
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", (d: any) => Math.max(1, (d.amount || 0) / 10))
      .attr("marker-end", "url(#arrow)");

    // Link labels
    const linkLabel = container
      .append("g")
      .selectAll("text")
      .data(edges)
      .enter()
      .append("text")
      .attr("font-size", "9px")
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .text((d: any) => d.label || "");

    // Nodes
    const node = container
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d: any) => (d.type === "company" ? 12 : d.type === "industry" ? 10 : 8))
      .attr("fill", (d: any) =>
        d.type === "company"
          ? "#1d4ed8"
          : d.type === "industry"
          ? "#64748b"
          : d3.schemeCategory10[d.group || 0]
      )
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .call(
        d3
          .drag<any, any>()
          .on("start", (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event: any, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node labels
    const label = container
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("font-size", "10px")
      .attr("font-weight", (d: any) => (d.type === "company" ? "bold" : "normal"))
      .attr("fill", "#0f172a")
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => (d.type === "company" ? 22 : 18))
      .text((d: any) => d.name);

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    // Zoom
    const zoom = d3.zoom<any, unknown>().on("zoom", (event) => {
      container.attr("transform", event.transform);
    });
    svg.call(zoom);

    return () => {
      simulation.stop();
    };
  }, [graph]);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-rule bg-paper-2">
      <svg
        ref={svgRef}
        width="100%"
        height="350"
        className="w-full"
        style={{ minHeight: "350px" }}
      />
    </div>
  );
}
