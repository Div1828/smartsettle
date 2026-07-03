# SmartSettle 💸

### *Optimal Expense Sharing & Debt Visualizer*

**SmartSettle** is a highly interactive, full-stack Next.js web application designed to track expenses within small groups (strictly capped at 5 members) and automatically simplify collective debt. Using a greedy graph-matching algorithm, it minimizes cash flows to resolve complex circular debts in the absolute fewest transactions possible.

---

## 🎨 Interactive DSA Visualizer

Instead of displaying a boring list of balances, SmartSettle features an interactive **React Flow** network graph that maps out debt relationships visually:

*   🔴 **Raw Chaos View:** Aggregates and displays the original, unoptimized direct peer-to-peer debts.
*   🟢 **Optimized Flow View:** Shows the simplified, optimal cash transfers calculated by the SmartSettle engine with animated directed flow paths.
*   🖱️ **Interactivity:** Custom dark-themed nodes representing group members showing their net balances (owed/owes/settled). Nodes can be freely dragged, and the viewport supports zooming and panning.

---

## ⚡ Core Features

1.  **Group Management:** Create expense groups (2 to 5 members) and dynamically manage members from the dashboard header.
2.  **The Ledger:** Log expenses with description, payer, amount, and custom participant selections (split shares are automatically calculated).
3.  **Algorithmic Debt Simplification:** Implements a greedy cash flow minimization algorithm that pairs the largest debtor with the largest creditor to resolve balances iteratively in at most $N-1$ transactions.
4.  **Recent Groups Dashboard:** A central landing hub showing recent groups, member counts, and expense activity.
5.  **Full-Stack Persistence:** Strict Mongoose schemas validating member limits and duplicate names, persisting data directly to MongoDB Atlas.

---

## 🛠️ Tech Stack

*   **Framework:** Next.js (App Router, React 19)
*   **Database:** MongoDB Atlas & Mongoose
*   **Graph Engine:** React Flow (`@xyflow/react`)
*   **Styling:** Tailwind CSS (v4) & shadcn/ui (Zinc theme)
*   **Icons:** Lucide React

---

