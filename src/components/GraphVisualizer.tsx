"use client";

import React, { useMemo } from "react";
import { ReactFlow, Background, Controls, Node, Edge, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Settlement } from "@/lib/calculator";
import { ITransaction } from "@/models/Group";

interface GraphVisualizerProps {
  members: string[];
  transactions: ITransaction[];
  settlements: Settlement[];
  netBalances: { [member: string]: number };
  showOptimized: boolean;
}

export default function GraphVisualizer({
  members,
  transactions,
  settlements,
  netBalances,
  showOptimized,
}: GraphVisualizerProps) {
  // 1. Calculate Nodes (spaced in a circle)
  const nodes = useMemo<Node[]>(() => {
    const cx = 350; // Center X
    const cy = 200; // Center Y
    const radius = 140; // Circular radius
    const angleStep = (2 * Math.PI) / members.length;

    return members.map((member, index) => {
      const angle = index * angleStep;
      const x = cx + radius * Math.cos(angle) - 62.5; // Offset half of min-w 125
      const y = cy + radius * Math.sin(angle) - 32;   // Offset half of height

      const balance = netBalances[member] || 0;

      return {
        id: member,
        position: { x, y },
        data: {
          label: (
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 min-w-[125px] shadow-lg backdrop-blur-md select-none">
              <span className="font-bold text-xs">{member}</span>
              {balance > 0.01 ? (
                <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1.5 border border-emerald-500/10">
                  +₹{balance.toFixed(2)}
                </span>
              ) : balance < -0.01 ? (
                <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full mt-1.5 border border-rose-500/10">
                  -₹{Math.abs(balance).toFixed(2)}
                </span>
              ) : (
                <span className="text-[9px] font-extrabold text-zinc-500 bg-zinc-850 px-2 py-0.5 rounded-full mt-1.5 border border-zinc-700">
                  Settled
                </span>
              )}
            </div>
          ),
        },
        style: { background: "transparent", border: "none", padding: 0 },
      };
    });
  }, [members, netBalances]);

  // 2. Calculate Edges based on state toggled
  const edges = useMemo<Edge[]>(() => {
    if (showOptimized) {
      // Map simplified settlements
      return settlements.map((settlement, idx) => ({
        id: `e-opt-${idx}-${settlement.from}-${settlement.to}`,
        source: settlement.from,
        target: settlement.to,
        label: `₹${settlement.amount.toFixed(2)}`,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 }, // green-500
        labelStyle: { fill: "#34d399", fontWeight: 700, fontSize: 10 },
        labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, rx: 4, ry: 4 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#10b981",
        },
      }));
    } else {
      // Aggregate original raw direct debts
      const rawDebts: { [key: string]: number } = {};
      transactions.forEach((t) => {
        const splitCount = t.splitAmong.length;
        if (splitCount > 0) {
          const share = t.amount / splitCount;
          t.splitAmong.forEach((person) => {
            if (person !== t.paidBy) {
              const key = `${person}->${t.paidBy}`;
              rawDebts[key] = (rawDebts[key] || 0) + share;
            }
          });
        }
      });

      return Object.entries(rawDebts).map(([key, amount], index) => {
        const [from, to] = key.split("->");
        return {
          id: `e-raw-${index}-${from}-${to}`,
          source: from,
          target: to,
          label: `₹${amount.toFixed(2)}`,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#f43f5e", strokeWidth: 1.5 }, // rose-500
          labelStyle: { fill: "#fb7185", fontWeight: 600, fontSize: 10 },
          labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, rx: 4, ry: 4 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: "#f43f5e",
          },
        };
      });
    }
  }, [showOptimized, settlements, transactions]);

  return (
    <div className="w-full h-[400px] border border-zinc-800 bg-zinc-950/60 rounded-xl overflow-hidden relative shadow-inner [&_.react-flow\_\_attribution]:hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesConnectable={false}
        nodesDraggable={true}
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={true}
      >
        <Background color="#27272a" gap={16} size={1} />
        <Controls showInteractive={false} className="bg-zinc-900 border border-zinc-800 text-white rounded-lg overflow-hidden [&_button]:bg-zinc-900 [&_button]:border-zinc-800 [&_button:hover]:bg-zinc-800 [&_svg]:fill-white" />
      </ReactFlow>
    </div>
  );
}
