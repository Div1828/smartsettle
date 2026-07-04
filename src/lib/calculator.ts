import { ITransaction } from "@/models/Group";

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function calculateSettlements(members: string[], transactions: ITransaction[]): Settlement[] {
  // 1. Calculate the net balance for every member
  const balances: Record<string, number> = {};
  members.forEach(m => balances[m] = 0);

  transactions.forEach(t => {
    const splitAmount = t.amount / t.splitAmong.length;
    
    // Add contributions from each payer
    t.paidBy.forEach(contribution => {
      if (balances[contribution.member] !== undefined) {
        balances[contribution.member] += contribution.amount;
      }
    });
    
    // Subtract split shares
    t.splitAmong.forEach(person => {
      if (balances[person] !== undefined) {
        balances[person] -= splitAmount;
      }
    });
  });

  // 2. Separate into Debtors and Creditors
  interface PersonBalance { name: string; amount: number; }
  const debtors: PersonBalance[] = [];
  const creditors: PersonBalance[] = [];

  for (const [name, amount] of Object.entries(balances)) {
    if (amount < -0.01) debtors.push({ name, amount: Math.abs(amount) });
    else if (amount > 0.01) creditors.push({ name, amount });
  }

  // 3. Sort descending to match maximums first (Greedy approach)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  // 4. Resolve debts
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const settledAmount = Math.min(debtor.amount, creditor.amount);
    
    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: Number(settledAmount.toFixed(2))
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
}