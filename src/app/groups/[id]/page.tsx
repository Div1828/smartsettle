"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  IndianRupee, 
  Receipt, 
  Calendar, 
  User, 
  Plus, 
  Check, 
  ChevronRight, 
  Sparkles,
  Info,
  Layers,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ITransaction, IPayer } from "@/models/Group";

interface ClientTransaction extends Omit<ITransaction, "paidBy"> {
  _id?: string;
  paidBy: IPayer[];
}

interface ClientGroup {
  _id: string;
  name: string;
  members: string[];
  transactions: ClientTransaction[];
  createdAt?: string;
}

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: groupId } = React.use(params);

  // Core state
  const [group, setGroup] = useState<ClientGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState("");
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Expanded transaction details state
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const toggleExpandTransaction = (txId: string) => {
    setExpandedTxId(expandedTxId === txId ? null : txId);
  };

  // Add Member state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setAddMemberLoading(true);
    setAddMemberError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newMemberName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add member.");
      }

      if (group) {
        setGroup({
          ...group,
          members: data.members,
        });
        
        // Auto select the new member in form split checkboxes
        setSplitAmong([...splitAmong, newMemberName.trim()]);
      }

      setNewMemberName("");
      setIsAddingMember(false);
    } catch (err: any) {
      console.error("RAW SYSTEM ERROR:", err);
      setAddMemberError(err.message || "Failed to add member.");
    } finally {
      setAddMemberLoading(false);
    }
  };

  // Delete Group state
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteGroup = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This will permanently erase the group ledger and transaction history. This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete group.");
      }

      router.push("/");
    } catch (err: any) {
      console.error("RAW SYSTEM ERROR:", err);
      alert(err.message || "Failed to delete group. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/transactions/${txId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete transaction.");
      }

      // Update local state by filtering out the deleted transaction
      if (group) {
        setGroup({
          ...group,
          transactions: group.transactions.filter((tx) => tx._id !== txId),
        });
      }
      
      // Close expanded state if we deleted the currently expanded item
      if (expandedTxId === txId) {
        setExpandedTxId(null);
      }
    } catch (err: any) {
      console.error("RAW SYSTEM ERROR:", err);
      alert(err.message || "Failed to delete expense. Please try again.");
    }
  };

  // Fetch group details
  const fetchGroup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load group details.");
      }

      setGroup(data);
      setError(null);
      
      // Initialize split checkboxes and payer contribution inputs
      if (data.members && data.members.length > 0) {
        setSplitAmong(data.members); // Default all selected
        const initialAmounts: Record<string, string> = {};
        data.members.forEach((m: string) => {
          initialAmounts[m] = "";
        });
        setPayerAmounts(initialAmounts);
      }
    } catch (err: any) {
      console.error("RAW SYSTEM ERROR:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  // Synchronize payerAmounts dictionary when group members list updates
  useEffect(() => {
    if (group?.members) {
      setPayerAmounts((prev) => {
        const updated = { ...prev };
        group.members.forEach((m) => {
          if (updated[m] === undefined) {
            updated[m] = "";
          }
        });
        return updated;
      });
    }
  }, [group?.members]);

  // Handle Split Among checkbox toggles
  const handleSplitCheckboxChange = (memberName: string) => {
    if (splitAmong.includes(memberName)) {
      // Keep at least one person in the split list
      if (splitAmong.length > 1) {
        setSplitAmong(splitAmong.filter((name) => name !== memberName));
      }
    } else {
      setSplitAmong([...splitAmong, memberName]);
    }
  };

  // Toggle all/none for split checkboxes
  const toggleSelectAllSplit = () => {
    if (!group) return;
    if (splitAmong.length === group.members.length) {
      // Keep first member selected to prevent empty selection
      setSplitAmong([group.members[0]]);
    } else {
      setSplitAmong(group.members);
    }
  };

  // Dynamically calculate total expense amount by summing up member contributions
  const calculatedTotalAmount = Object.values(payerAmounts).reduce((sum, val) => {
    const num = Number(val);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  // Submit new expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // Validation
    if (!description.trim()) {
      setFormError("Description is required.");
      setFormLoading(false);
      return;
    }

    const payersList = Object.entries(payerAmounts)
      .map(([member, val]) => ({ member, amount: Number(val) }))
      .filter((p) => p.amount > 0);

    if (payersList.length === 0) {
      setFormError("At least one member must pay an amount greater than zero.");
      setFormLoading(false);
      return;
    }

    if (calculatedTotalAmount <= 0) {
      setFormError("Total expense amount must be greater than zero.");
      setFormLoading(false);
      return;
    }

    if (splitAmong.length === 0) {
      setFormError("At least one person must split this expense.");
      setFormLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
          amount: calculatedTotalAmount,
          paidBy: payersList,
          splitAmong,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add expense.");
      }

      // Update local state with new transaction
      if (group) {
        setGroup({
          ...group,
          transactions: [...group.transactions, data],
        });
      }

      // Reset form fields
      setDescription("");
      const clearedAmounts: Record<string, string> = {};
      if (group?.members) {
        group.members.forEach((m) => {
          clearedAmounts[m] = "";
        });
      }
      setPayerAmounts(clearedAmounts);
      if (group?.members.length) {
        setSplitAmong(group.members);
      }
    } catch (err: any) {
      console.error("RAW SYSTEM ERROR:", err);
      setFormError(err.message || "Failed to add expense. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // Format multiple payers string for ledger view
  const formatPayers = (paidBy: IPayer[]) => {
    if (!paidBy || paidBy.length === 0) return "Paid by Nobody";
    if (paidBy.length === 1) {
      return `Paid by ${paidBy[0].member}`;
    }
    if (paidBy.length === 2) {
      return `Paid by ${paidBy[0].member} (₹${paidBy[0].amount.toFixed(2)}), ${paidBy[1].member} (₹${paidBy[1].amount.toFixed(2)})`;
    }
    return "Paid by Multiple Payers";
  };

  // Calculate stats
  const totalExpenses = group?.transactions.reduce((acc, tx) => acc + tx.amount, 0) || 0;

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-screen bg-zinc-950 text-zinc-50 flex flex-col justify-center items-center gap-4">
        <div className="size-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-350 text-sm font-medium">Loading SmartSettle Ledger...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex-1 w-full min-h-screen bg-zinc-950 text-zinc-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="size-12 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-400 mb-4">
          <Info className="size-6" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Failed to Load Group</h1>
        <p className="text-zinc-300 max-w-md mb-6">{error || "Group details could not be retrieved."}</p>
        <Button onClick={() => router.push("/")} className="bg-white text-zinc-950 hover:bg-zinc-200">
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12 lg:p-16 relative overflow-x-hidden">
      
      {/* Subtle styling gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-800/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-900/20 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col gap-8 relative">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="flex items-start gap-4">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              size="icon"
              className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 size-9 text-zinc-300 hover:text-white shrink-0"
              title="Back to Landing Page"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{group.name}</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300">
                  {group.members.length} Members
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mt-1">
                <p className="text-zinc-400 text-xs md:text-sm">
                  Members: {group.members.join(", ")}
                </p>
                {group.members.length < 10 && !isAddingMember && (
                  <button
                    onClick={() => setIsAddingMember(true)}
                    className="text-[10px] text-zinc-300 hover:text-white font-semibold underline underline-offset-2 transition-all text-left self-start sm:self-auto cursor-pointer"
                  >
                    + Add Member
                  </button>
                )}
              </div>
              
              {isAddingMember && group.members.length < 10 && (
                <form onSubmit={handleAddMember} className="flex items-center gap-2 mt-2 flex-wrap">
                  <Input
                    type="text"
                    placeholder="New member name"
                    value={newMemberName}
                    onChange={(e) => {
                      setNewMemberName(e.target.value);
                      setAddMemberError(null);
                    }}
                    className="h-7 text-xs border-zinc-800 bg-zinc-900/60 focus:border-zinc-500 w-36 text-white placeholder-zinc-700 rounded-lg px-2.5 font-medium"
                    disabled={addMemberLoading}
                    autoFocus
                    required
                  />
                  <Button
                    type="submit"
                    size="xs"
                    className="bg-white text-zinc-950 hover:bg-zinc-200 h-7 px-2.5 rounded-lg font-semibold"
                    disabled={addMemberLoading}
                  >
                    {addMemberLoading ? "Adding..." : "Add"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setIsAddingMember(false);
                      setNewMemberName("");
                      setAddMemberError(null);
                    }}
                    className="text-zinc-400 hover:text-white h-7 px-2 rounded-lg"
                    disabled={addMemberLoading}
                  >
                    Cancel
                  </Button>
                  {addMemberError && (
                    <span className="text-[10px] text-red-400 font-semibold bg-red-950/10 border border-red-900/20 px-2 py-0.5 rounded-md">
                      {addMemberError}
                    </span>
                  )}
                </form>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 self-start sm:self-auto">
            <Button
              onClick={handleDeleteGroup}
              variant="destructive"
              className="h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-md text-xs font-semibold"
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Group"}
            </Button>
            <Button
              onClick={() => router.push(`/groups/${groupId}/settle`)}
              className="bg-white hover:bg-zinc-200 text-zinc-950 font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <Layers className="size-4" />
              <span>Visualize Settlement</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: Ledger & Overview */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-zinc-800/60 bg-zinc-900/20 backdrop-blur-sm p-4 flex items-center gap-4">
                <div className="size-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <IndianRupee className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total Expenses</p>
                  <p className="text-xl font-bold text-white mt-0.5">₹{totalExpenses.toFixed(2)}</p>
                </div>
              </Card>
              <Card className="border-zinc-800/60 bg-zinc-900/20 backdrop-blur-sm p-4 flex items-center gap-4">
                <div className="size-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Transactions count</p>
                  <p className="text-xl font-bold text-white mt-0.5">{group.transactions.length}</p>
                </div>
              </Card>
            </div>

            {/* Ledger List Card */}
            <Card className="border-zinc-800 bg-zinc-900/40 shadow-xl shadow-black/40 backdrop-blur-md">
              <CardHeader className="border-b border-zinc-800/80 p-5">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="size-4.5 text-zinc-300" />
                  <span>The Ledger</span>
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  History of logged group expenses. Click any row to expand breakdowns.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-5">
                {group.transactions.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center">
                    <div className="size-10 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 mb-3">
                      <Receipt className="size-5" />
                    </div>
                    <p className="text-sm text-white font-medium">No expenses logged yet</p>
                    <p className="text-xs text-zinc-300 mt-1 max-w-xs">Use the form on the right to log the first expense for this group.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-900/80 max-h-[460px] overflow-y-auto pr-1">
                    {group.transactions.map((tx, idx) => {
                      const isExpanded = expandedTxId === tx._id;
                      return (
                        <div key={tx._id || idx} className="border-b border-zinc-900/40 last:border-b-0">
                          <div 
                            onClick={() => tx._id && toggleExpandTransaction(tx._id)}
                            className="p-4 flex justify-between items-start hover:bg-zinc-900/40 transition-colors cursor-pointer select-none"
                          >
                            <div className="flex gap-3">
                              <div className="size-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-300 mt-0.5">
                                <User className="size-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{tx.description}</p>
                                <p className="text-xs text-zinc-350 mt-1">
                                  <span className="font-semibold text-white">{formatPayers(tx.paidBy)}</span> &bull; Split among {tx.splitAmong.length} members
                                </p>
                                <p className="text-[10px] text-zinc-300 mt-1 flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Recently"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-white">₹{tx.amount.toFixed(2)}</p>
                                <p className="text-[10px] text-zinc-300 mt-1">
                                  ₹{(tx.amount / tx.splitAmong.length).toFixed(2)} / person
                                </p>
                              </div>
                              {tx._id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTransaction(tx._id!);
                                  }}
                                  className="text-zinc-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-zinc-900/60 cursor-pointer"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {isExpanded && tx._id && (
                            <div className="px-4 pb-4 pt-2 bg-zinc-950/40 border-t border-zinc-900/40 animate-fade-in space-y-2">
                              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Payer Contribution Breakdown</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {tx.paidBy.map((payer, pidx) => (
                                  <div key={pidx} className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-2 rounded-lg">
                                    <span className="text-zinc-300 font-medium">{payer.member}</span>
                                    <span className="text-white font-semibold">₹{payer.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT SIDE: Add Expense Form */}
          <div className="lg:col-span-5">
            <Card className="border-zinc-800 bg-zinc-900/40 shadow-xl shadow-black/40 backdrop-blur-md">
              <CardHeader className="border-b border-zinc-800/80 p-5">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="size-4.5 text-zinc-300" />
                  <span>Add Expense</span>
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Log payments to split among group members.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5">
                <form onSubmit={handleAddExpense} className="space-y-5">
                  
                  {/* Expense Description */}
                  <div className="space-y-1.5">
                    <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Description
                    </label>
                    <Input
                      id="description"
                      type="text"
                      placeholder="e.g. Dinner, Uber, Groceries"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setFormError(null);
                      }}
                      className="border-zinc-800 bg-zinc-900/60 text-white placeholder-zinc-650 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 h-9 px-3 text-sm transition-all"
                      disabled={formLoading}
                      required
                    />
                  </div>

                  {/* Multi-Payer Contribution Inputs */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Amount Paid By Members
                    </label>
                    <div className="space-y-2.5 border border-zinc-850 bg-zinc-900/30 rounded-lg p-3 max-h-[220px] overflow-y-auto">
                      {group.members.map((member) => (
                        <div key={member} className="flex justify-between items-center gap-4 py-0.5">
                          <span className="text-xs font-semibold text-white truncate max-w-[150px]">{member}</span>
                          <div className="relative w-36">
                            <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-zinc-400" />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={payerAmounts[member] || ""}
                              onChange={(e) => {
                                setPayerAmounts({
                                  ...payerAmounts,
                                  [member]: e.target.value
                                });
                                setFormError(null);
                              }}
                              className="h-8 pl-7 pr-2 text-xs border-zinc-800 bg-zinc-900/60 text-white placeholder-zinc-650 focus:border-zinc-400 transition-all rounded-md"
                              disabled={formLoading}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center px-1 pt-2 border-t border-zinc-900">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Expense Amount</span>
                      <span className="text-sm font-bold text-white">₹{calculatedTotalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Split Among checkboxes */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Split Among
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={toggleSelectAllSplit}
                        className="text-[10px] text-zinc-300 hover:text-white hover:bg-zinc-800/80 h-5 px-1.5 rounded"
                        disabled={formLoading}
                      >
                        {splitAmong.length === group.members.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>

                    <div className="space-y-2 border border-zinc-850 bg-zinc-900/30 rounded-lg p-3 max-h-[160px] overflow-y-auto">
                      {group.members.map((member) => {
                        const isSelected = splitAmong.includes(member);
                        return (
                          <button
                            key={member}
                            type="button"
                            onClick={() => handleSplitCheckboxChange(member)}
                            className="flex items-center gap-2.5 w-full text-left py-1 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer select-none"
                            disabled={formLoading}
                          >
                            <div className={`size-4 rounded border flex items-center justify-center transition-all ${
                              isSelected 
                                ? "bg-white border-white text-zinc-950" 
                                : "border-zinc-800 bg-zinc-900 text-transparent"
                            }`}>
                              {isSelected && <Check className="size-3 stroke-[3]" />}
                            </div>
                            <span className="font-semibold text-white">{member}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Error display */}
                  {formError && (
                    <div className="p-3 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-red-500 shrink-0" />
                      <p>{formError}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold h-10 transition-all rounded-lg shadow-md flex items-center justify-center gap-2 mt-2"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <div className="flex items-center gap-1.5">
                        <div className="size-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Adding Expense...</span>
                      </div>
                    ) : (
                      <>
                        <Plus className="size-4" />
                        <span>Add Expense</span>
                      </>
                    )}
                  </Button>

                </form>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
