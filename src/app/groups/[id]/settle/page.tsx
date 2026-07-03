"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  IndianRupee, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  Activity,
  Users,
  TrendingDown,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { calculateSettlements, Settlement } from "@/lib/calculator";
import { ITransaction } from "@/models/Group";
import GraphVisualizer from "@/components/GraphVisualizer";

interface ClientTransaction extends ITransaction {
  _id?: string;
}

interface ClientGroup {
  _id: string;
  name: string;
  members: string[];
  transactions: ClientTransaction[];
  createdAt?: string;
}

export default function SettlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: groupId } = React.use(params);

  // Core state
  const [group, setGroup] = useState<ClientGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [netBalances, setNetBalances] = useState<{ [member: string]: number }>({});
  const [rawDebtsCount, setRawDebtsCount] = useState(0);
  const [showOptimized, setShowOptimized] = useState(true);

  useEffect(() => {
    const fetchGroupAndCalculate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/groups/${groupId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load group.");
        }

        setGroup(data);
        
        // Calculate settlements using the greedy algorithm
        const optimizedSettlements = calculateSettlements(data.members, data.transactions);
        setSettlements(optimizedSettlements);

        // Calculate net balances manually to explain the math behind the scenes
        const balances: { [member: string]: number } = {};
        data.members.forEach((m: string) => {
          balances[m] = 0;
        });

        let rawDebts = 0;
        data.transactions.forEach((tx: ClientTransaction) => {
          const splitCount = tx.splitAmong.length;
          if (splitCount > 0) {
            const share = tx.amount / splitCount;
            tx.splitAmong.forEach((member) => {
              balances[member] -= share;
              // If someone else paid, it creates a raw direct peer-to-peer debt relation
              if (member !== tx.paidBy) {
                rawDebts++;
              }
            });
          }
          balances[tx.paidBy] += tx.amount;
        });

        // Round balances
        Object.keys(balances).forEach((m) => {
          balances[m] = Math.round(balances[m] * 100) / 100;
        });

        setNetBalances(balances);
        setRawDebtsCount(rawDebts);
        setError(null);
      } catch (err: any) {
        console.error("RAW SYSTEM ERROR:", err);
        setError(err.message || "Failed to fetch details.");
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupAndCalculate();
    }
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-screen bg-zinc-950 text-zinc-50 flex flex-col justify-center items-center gap-4">
        <div className="size-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Simplifying debts using greedy algorithm...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex-1 w-full min-h-screen bg-zinc-950 text-zinc-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="size-12 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-400 mb-4">
          <Info className="size-6" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Failed to Load Calculator</h1>
        <p className="text-zinc-400 max-w-md mb-6">{error || "Group details could not be loaded."}</p>
        <Button onClick={() => router.push("/")} className="bg-white text-zinc-950 hover:bg-zinc-200">
          Return Home
        </Button>
      </div>
    );
  }

  // Calculate efficiency percentage
  const reductionPercent = rawDebtsCount > 0 
    ? Math.round(((rawDebtsCount - settlements.length) / rawDebtsCount) * 100)
    : 0;

  return (
    <div className="flex-1 w-full min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12 lg:p-16 relative overflow-x-hidden">
      
      {/* Visual background styling */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-800/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-900/20 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto flex flex-col gap-8 relative">
        
        {/* Navigation & Header */}
        <div className="flex items-start gap-4 border-b border-zinc-800/80 pb-6">
          <Button
            onClick={() => router.push(`/groups/${groupId}`)}
            variant="outline"
            size="icon"
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 size-9 text-zinc-400 hover:text-white shrink-0"
            title="Back to Ledger"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Debt Simplification</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-zinc-850 bg-zinc-900 text-zinc-400">
                DSA Visualizer
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-1 md:text-sm">
              Analyzing cash flow for <span className="text-zinc-300 font-semibold">{group.name}</span>
            </p>
          </div>
        </div>

        {/* Algorithm Efficiency Banner (Only show if there are settlements) */}
        {settlements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/20 border border-zinc-850 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Sparkles className="size-16" />
            </div>
            <div className="flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Raw Transactions</span>
              <span className="text-2xl font-extrabold text-zinc-400 mt-1">{rawDebtsCount} transfers</span>
              <span className="text-xs text-zinc-650 mt-1">Direct peer-to-peer debts</span>
            </div>
            <div className="flex flex-col justify-between border-t md:border-t-0 md:border-x border-zinc-850/80 pt-3 md:pt-0 md:px-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">SmartSettle Optimized</span>
              <span className="text-2xl font-extrabold text-white mt-1">{settlements.length} transfers</span>
              <span className="text-xs text-zinc-650 mt-1">Minimal settlement transactions</span>
            </div>
            <div className="flex flex-col justify-between border-t md:border-t-0 pt-3 md:pt-0 md:pl-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cash Flow Efficiency</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingDown className="size-5" />
                <span>{reductionPercent}% Fewer</span>
              </span>
              <span className="text-xs text-zinc-650 mt-1">Redundant transfers eliminated</span>
            </div>
          </div>
        )}

        {/* Core Split Screen Layout: Balances vs Settlements */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Net Balances (The Math Behind the Scenes) */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <Card className="border-zinc-800 bg-zinc-900/40 shadow-xl shadow-black/40 backdrop-blur-md">
              <CardHeader className="border-b border-zinc-800/80 p-5">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="size-4 text-zinc-400" />
                  <span>Net Balances</span>
                </CardTitle>
                <CardDescription className="text-zinc-500 text-xs">
                  How much each person has paid vs owes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {Object.entries(netBalances).map(([member, balance]) => {
                  const isDebtor = balance < -0.01;
                  const isCreditor = balance > 0.01;
                  return (
                    <div key={member} className="flex justify-between items-center py-1.5 border-b border-zinc-900/40 last:border-b-0">
                      <span className="text-sm font-semibold text-zinc-300">{member}</span>
                      {isCreditor && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Owed +₹{balance.toFixed(2)}
                        </span>
                      )}
                      {isDebtor && (
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          Owes -₹{Math.abs(balance).toFixed(2)}
                        </span>
                      )}
                      {!isCreditor && !isDebtor && (
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                          Settled
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/40 shadow-xl shadow-black/40 backdrop-blur-md">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="size-4 text-zinc-500" />
                  <span>How does this work?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-xs text-zinc-500 leading-relaxed space-y-2">
                <p>
                  1. <strong>Net Balances:</strong> We calculate each person's net balance by subtracting their total share of group expenses from what they actually paid.
                </p>
                <p>
                  2. <strong>Greedy Matching:</strong> The engine pairs the person with the largest net debt with the person who is owed the largest credit.
                </p>
                <p>
                  3. <strong>Minimization:</strong> A single transaction settles one of the two parties, and the process repeats. This reduces the number of payments to at most <i>N - 1</i> transfers.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Optimized Settlement Transfers */}
          <div className="md:col-span-7">
            <Card className="border-zinc-800 bg-zinc-900/40 shadow-xl shadow-black/40 backdrop-blur-md h-full">
              <CardHeader className="border-b border-zinc-800/80 p-5 flex flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="size-4 text-zinc-400" />
                    <span>Visual Debt Flow</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    {showOptimized ? "Optimized minimal payments flow." : "Messy, unoptimized raw peer-to-peer debts."}
                  </CardDescription>
                </div>
                <CardAction>
                  <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setShowOptimized(false)}
                      className={`px-3 py-1 rounded-md transition-all font-semibold select-none cursor-pointer ${
                        !showOptimized 
                          ? "bg-zinc-800 text-rose-400 shadow-inner" 
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Raw Chaos
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOptimized(true)}
                      className={`px-3 py-1 rounded-md transition-all font-semibold select-none cursor-pointer ${
                        showOptimized 
                          ? "bg-white text-zinc-950 shadow-sm" 
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Optimized
                    </button>
                  </div>
                </CardAction>
              </CardHeader>

              <CardContent className="p-5">
                {settlements.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center">
                    <div className="size-12 rounded-full bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                      <CheckCircle className="size-6" />
                    </div>
                    <p className="text-sm text-zinc-300 font-bold">All Settled Up!</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      No debts remain. Everyone has paid their exact share of the group expenses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <GraphVisualizer
                      members={group.members}
                      transactions={group.transactions}
                      settlements={settlements}
                      netBalances={netBalances}
                      showOptimized={showOptimized}
                    />
                    
                    {/* Compact visual legend */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-900 pt-3 px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-rose-500" />
                        <span>Debtor (Owes money)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span>Creditor (Owed money)</span>
                      </span>
                      <span className="text-zinc-600 font-mono">
                        Double-click / Drag nodes to organize
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
