"use client";

import React, { useMemo, useEffect } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Node, 
  Edge, 
  MarkerType,
  useNodesState,
  useEdgesState,
  ReactFlowInstance
} from "@xyflow/react";
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
  
  // 1. Calculate Initial Nodes (spaced in a circle)
  const initialNodes = useMemo<Node[]>(() => {
    const cx = 250; // Center X
    const cy = 250; // Center Y
    const radius = 120; // Circular radius
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
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 min-w-[125px] shadow-2xl backdrop-blur-md select-none hover:border-zinc-500 transition-colors">
              <span className="font-bold text-xs tracking-wide">{member}</span>
              {balance > 0.01 ? (
                <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full mt-2 border border-emerald-500/30">
                  +₹{balance.toFixed(2)}
                </span>
              ) : balance < -0.01 ? (
                <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/20 px-2.5 py-0.5 rounded-full mt-2 border border-rose-500/30">
                  -₹{Math.abs(balance).toFixed(2)}
                </span>
              ) : (
                <span className="text-[9px] font-extrabold text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full mt-2 border border-zinc-700">
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

  // 2. Calculate Initial Edges based on state toggled
  const initialEdges = useMemo<Edge[]>(() => {
    if (showOptimized) {
      return settlements.map((settlement, idx) => ({
        id: `e-opt-${idx}-${settlement.from}-${settlement.to}`,
        source: settlement.from,
        target: settlement.to,
        label: `₹${settlement.amount.toFixed(2)}`,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 3 }, // green-500, thicker
        labelStyle: { fill: "#34d399", fontWeight: 800, fontSize: 11 },
        labelBgStyle: { fill: "#09090b", fillOpacity: 0.95, rx: 6, ry: 6 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 22,
          height: 22,
          color: "#10b981",
        },
      }));
    } else {
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
          style: { stroke: "#f43f5e", strokeWidth: 2 }, // rose-500, thicker
          labelStyle: { fill: "#fb7185", fontWeight: 700, fontSize: 11 },
          labelBgStyle: { fill: "#09090b", fillOpacity: 0.95, rx: 6, ry: 6 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: "#f43f5e",
          },
        };
      });
    }
  }, [showOptimized, settlements, transactions]);

  // Use States initialized directly with calculated values so the first render is NOT empty
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  // Synchronize state when initial values change (due to prop updates)
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div 
      className="w-full border border-zinc-800 bg-zinc-950/80 rounded-xl overflow-hidden relative shadow-inner [&_.react-flow\_\_attribution]:hidden"
      style={{ height: "550px", minHeight: "550px" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesConnectable={false}
        nodesDraggable={true}
        style={{ width: "100%", height: "100%" }}
        onInit={(instance: ReactFlowInstance) => {
          // Delayed fitView ensures that the browser layout pass is complete
          // and the container width/height are resolved properly.
          setTimeout(() => {
            instance.fitView({ padding: 0.25, duration: 200 });
          }, 150);
        }}
      >
        <Background color="#27272a" gap={16} size={1} />
        <Controls showInteractive={false} className="bg-zinc-900 border border-zinc-800 text-white rounded-lg overflow-hidden [&_button]:bg-zinc-900 [&_button]:border-zinc-800 [&_button:hover]:bg-zinc-800 [&_svg]:fill-white" />
      </ReactFlow>
    </div>
  );
}
