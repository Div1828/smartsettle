"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Users, ArrowRight, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  
  // State for form
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<string[]>(["", ""]); // Start with 2 members
  
  // UX states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recent groups state
  const [recentGroups, setRecentGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  const fetchRecentGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await fetch("/api/groups");
      const data = await response.json();
      if (response.ok) {
        setRecentGroups(data);
      }
    } catch (err) {
      console.error("RAW SYSTEM ERROR:", err);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentGroups();
  }, []);

  // Add a member input field (max 5)
  const addMemberField = () => {
    if (members.length < 5) {
      setMembers([...members, ""]);
      setError(null);
    }
  };

  // Remove a member input field (min 2)
  const removeMemberField = (index: number) => {
    if (members.length > 2) {
      const updated = members.filter((_, i) => i !== index);
      setMembers(updated);
      setError(null);
    }
  };

  // Update member name
  const handleMemberChange = (index: number, value: string) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
    setError(null);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!groupName.trim()) {
      setError("Group name is required.");
      setLoading(false);
      return;
    }

    const cleanedMembers = members.map((m) => m.trim()).filter((m) => m !== "");
    
    if (cleanedMembers.length < 2) {
      setError("Please add at least 2 members.");
      setLoading(false);
      return;
    }

    if (members.some((m) => !m.trim())) {
      setError("All member name fields must be filled out.");
      setLoading(false);
      return;
    }

    // Check for duplicate names
    const uniqueMembers = new Set(cleanedMembers);
    if (uniqueMembers.size !== cleanedMembers.length) {
      setError("Member names must be unique.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName.trim(),
          members: cleanedMembers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      // Redirect to groups/[id]
      router.push(`/groups/${data._id || data.id}`);
    } catch (err: any) {
      console.error("RAW SYSTEM ERROR:", err);
      setError(err.message || "Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-zinc-50 overflow-x-hidden font-sans">
      
      {/* Left Side: Product Showcase & Brand Hero */}
      <div className="lg:col-span-7 flex flex-col justify-between p-8 md:p-16 bg-[radial-gradient(ellipse_at_top_left,rgba(39,39,42,0.6),rgba(9,9,11,1))] relative overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-800/50">
        
        {/* Subtle animated background shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-800/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/20 blur-[120px] pointer-events-none" />
        
        {/* Logo/Branding */}
        <div className="flex items-center gap-2.5 mb-12 lg:mb-0">
          <div className="flex items-center justify-center size-9 rounded-xl bg-zinc-100 text-zinc-950 font-bold shadow-md shadow-zinc-500/10 transition-transform duration-300 hover:scale-105">
            S
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            SmartSettle
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400">
            v1.0
          </span>
        </div>

        {/* Hero Messaging */}
        <div className="my-auto py-12 md:py-20 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300 mb-6 font-medium shadow-inner backdrop-blur-md">
            <Sparkles className="size-3.5 text-yellow-500 animate-pulse" />
            <span>Optimal debt-simplification engine</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6">
            Expense sharing,{" "}
            <span className="bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
              minimized cash flow.
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 leading-relaxed mb-8">
            SmartSettle simplifies debts between friends using a greedy matching algorithm. We match maximum debtors to maximum creditors, reducing the number of total transactions to the mathematical minimum.
          </p>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-zinc-800/80 pt-8">
            <div className="flex gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                <Users className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm">Up to 5 Members</h3>
                <p className="text-xs text-zinc-500 mt-1">Perfect for roommates, trips, dinners, and small group tasks.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                <Activity className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm">Greedy Algorithm</h3>
                <p className="text-xs text-zinc-500 mt-1">Eliminates complex circular transactions and redundant balances.</p>
              </div>
            </div>
          </div>
        </div>

      
      </div>

      {/* Right Side: Interactive Group Creation Form */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 bg-zinc-950 relative">
        <div className="w-full max-w-md">
          <Card className="border-zinc-800 bg-zinc-900/40 shadow-2xl shadow-black/80 backdrop-blur-md p-6">
            <CardHeader className="p-0 pb-6 border-b border-zinc-800/80 mb-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Create New Group</span>
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1">
                Enter a group name and add up to 5 members to start splitting.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Group Name input */}
                <div className="space-y-2">
                  <label htmlFor="groupName" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Group Name
                  </label>
                  <Input
                    id="groupName"
                    type="text"
                    placeholder="e.g. Ski Trip 2026, Roomies"
                    value={groupName}
                    onChange={(e) => {
                      setGroupName(e.target.value);
                      setError(null);
                    }}
                    className="border-zinc-800 bg-zinc-900/60 text-white placeholder-zinc-600 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 h-10 px-3 text-sm transition-all"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Member inputs */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Group Members ({members.length}/5)
                    </label>
                    {members.length < 5 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addMemberField}
                        className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 h-7 px-2 flex items-center gap-1 rounded-md transition-all"
                        disabled={loading}
                      >
                        <Plus className="size-3.5" />
                        <span>Add Member</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {members.map((member, index) => (
                      <div key={index} className="flex gap-2 items-center group">
                        <div className="flex items-center justify-center size-8 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400 group-focus-within:border-zinc-500 transition-colors">
                          {index + 1}
                        </div>
                        <Input
                          type="text"
                          placeholder={`Member ${index + 1} Name`}
                          value={member}
                          onChange={(e) => handleMemberChange(index, e.target.value)}
                          className="border-zinc-800 bg-zinc-900/60 text-white placeholder-zinc-600 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 flex-1 h-9 px-3 text-sm transition-all"
                          disabled={loading}
                          required
                        />
                        {members.length > 2 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => removeMemberField(index)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 size-9 shrink-0 transition-colors rounded-lg"
                            disabled={loading}
                            title="Remove Member"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation error display */}
                {error && (
                  <div className="p-3 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg animate-fade-in flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-red-500 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold h-11 transition-all rounded-lg shadow-lg flex items-center justify-center gap-2 mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Initialize SmartSettle Group</span>
                      <ArrowRight className="size-4 group-hover/button:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>

          {/* Recent Groups Section */}
          <div className="mt-8 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Recent Groups
            </h3>
            {groupsLoading ? (
              <div className="flex justify-center items-center py-6">
                <div className="size-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentGroups.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No groups created yet. Initialize one above!</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1">
                {recentGroups.map((g) => (
                  <div 
                    key={g._id} 
                    onClick={() => router.push(`/groups/${g._id}`)}
                    className="border border-zinc-800/85 bg-zinc-900/20 hover:bg-zinc-900/60 hover:border-zinc-700/60 transition-all rounded-xl p-4 flex justify-between items-center cursor-pointer group/item shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-zinc-200 text-sm group-hover/item:text-white transition-colors">{g.name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                        <span>{g.members.length} Members</span>
                        <span>&bull;</span>
                        <span>{g.transactions ? g.transactions.length : 0} Expenses</span>
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-zinc-600 group-hover/item:text-white group-hover/item:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
