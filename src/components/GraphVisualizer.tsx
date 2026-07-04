"use client";

import React, { useMemo, useEffect, useRef } from "react";
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
  todaySpent?: { [member: string]: number };
  actualSpentToday?: { [member: string]: number };
  isFullscreen?: boolean;
  nodeScale?: number;
}

export default function GraphVisualizer({
  members,
  transactions,
  settlements,
  netBalances,
  showOptimized,
  todaySpent = {},
  actualSpentToday = {},
  isFullscreen = false,
  nodeScale = 1,
}: GraphVisualizerProps) {
  
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // 1. Calculate Initial Nodes (spaced in a circle)
  const initialNodes = useMemo<Node[]>(() => {
    const cx = 250; // Center X
    const cy = 250; // Center Y
    const radius = 120; // Circular radius
    const angleStep = (2 * Math.PI) / members.length;

    return members.map((member, index) => {
      const angle = index * angleStep;
      const x = cx + radius * Math.cos(angle) - (65 * nodeScale); // Dynamic offset matching scaled width
      const y = cy + radius * Math.sin(angle) - (32 * nodeScale); // Dynamic offset matching scaled height

      const balance = netBalances[member] || 0;
      const spentTodayAmount = todaySpent[member] || 0;
      const actualSpentAmount = actualSpentToday[member] || 0;

      return {
        id: member,
        position: { x, y },
        data: {
          label: (
            <div 
              className="flex flex-col items-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl backdrop-blur-md select-none hover:border-zinc-500 transition-colors"
              style={{
                minWidth: `${130 * nodeScale}px`,
                padding: `${12 * nodeScale}px`,
              }}
            >
              <span 
                className="font-bold tracking-wide text-center"
                style={{ fontSize: `${12 * nodeScale}px` }}
              >
                {member}
              </span>
              {balance > 0.01 ? (
                <span 
                  className="font-extrabold text-emerald-400 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-center"
                  style={{
                    fontSize: `${9 * nodeScale}px`,
                    paddingLeft: `${10 * nodeScale}px`,
                    paddingRight: `${10 * nodeScale}px`,
                    paddingTop: `${2 * nodeScale}px`,
                    paddingBottom: `${2 * nodeScale}px`,
                    marginTop: `${8 * nodeScale}px`
                  }}
                >
                  +₹{balance.toFixed(2)}
                </span>
              ) : balance < -0.01 ? (
                <span 
                  className="font-extrabold text-rose-400 bg-rose-500/20 rounded-full border border-rose-500/30 text-center"
                  style={{
                    fontSize: `${9 * nodeScale}px`,
                    paddingLeft: `${10 * nodeScale}px`,
                    paddingRight: `${10 * nodeScale}px`,
                    paddingTop: `${2 * nodeScale}px`,
                    paddingBottom: `${2 * nodeScale}px`,
                    marginTop: `${8 * nodeScale}px`
                  }}
                >
                  -₹{Math.abs(balance).toFixed(2)}
                </span>
              ) : (
                <span 
                  className="font-extrabold text-zinc-400 bg-zinc-800 rounded-full border border-zinc-700 text-center"
                  style={{
                    fontSize: `${9 * nodeScale}px`,
                    paddingLeft: `${10 * nodeScale}px`,
                    paddingRight: `${10 * nodeScale}px`,
                    paddingTop: `${2 * nodeScale}px`,
                    paddingBottom: `${2 * nodeScale}px`,
                    marginTop: `${8 * nodeScale}px`
                  }}
                >
                  Settled
                </span>
              )}
              
              {/* Daily spending tracking sub-panel */}
              <div 
                className="flex flex-col items-stretch w-full border-t border-zinc-800/80 px-0.5"
                style={{
                  marginTop: `${10 * nodeScale}px`,
                  paddingTop: `${8 * nodeScale}px`,
                  gap: `${2 * nodeScale}px`,
                  fontSize: `${8.5 * nodeScale}px`
                }}
              >
                <div className="flex justify-between gap-2">
                  <span>Paid Today:</span>
                  <span className="text-zinc-200 font-medium">₹{spentTodayAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Actual Spent:</span>
                  <span className="text-white font-semibold">₹{actualSpentAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ),
        },
        style: { background: "transparent", border: "none", padding: 0 },
      };
    });
  }, [members, netBalances, todaySpent, actualSpentToday, nodeScale]);

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
        if (splitCount > 0 && t.paidBy && Array.isArray(t.paidBy)) {
          t.paidBy.forEach((payer) => {
            const payerShare = payer.amount / splitCount;
            t.splitAmong.forEach((person) => {
              if (person !== payer.member) {
                const key = `${person}->${payer.member}`;
                rawDebts[key] = (rawDebts[key] || 0) + payerShare;
              }
            });
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
    setNodes((currentNodes) => {
      if (currentNodes.length === 0) return initialNodes;
      
      return initialNodes.map((newNode) => {
        const existingNode = currentNodes.find((n) => n.id === newNode.id);
        // Keep the existing dragged position, but update the data/styling
        if (existingNode) {
          return { ...newNode, position: existingNode.position };
        }
        return newNode;
      });
    });
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Trigger fitView whenever the fullscreen state changes to keep the graph centered
  useEffect(() => {
    if (reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.25, duration: 250 });
      }, 150);
    }
  }, [isFullscreen]);

  return (
    <div 
      className={
        isFullscreen 
          ? "w-full flex-1 min-h-0 relative border border-zinc-800 bg-zinc-950/80 rounded-xl overflow-hidden [&_.react-flow\_\_attribution]:hidden"
          : "w-full border border-zinc-800 bg-zinc-950/80 rounded-xl overflow-hidden relative shadow-inner [&_.react-flow\_\_attribution]:hidden"
      }
      style={
        isFullscreen 
          ? { flex: 1, minHeight: 0 } 
          : { height: "550px", minHeight: "550px" }
      }
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
          reactFlowInstance.current = instance;
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
