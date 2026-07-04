import mongoose, { Schema, Document } from "mongoose";

// Structure of a single payer's contribution in a transaction
export interface IPayer {
  member: string;
  amount: number;
}

// Structure of a single transaction entry inside the group
export interface ITransaction {
  description: string;
  amount: number;
  paidBy: IPayer[];      // Array of members who paid and their respective contribution
  splitAmong: string[]; // Array of names involved in this specific expense
  createdAt: Date;
}

// Structure of the overall Group document
export interface IGroup extends Document {
  name: string;
  members: string[]; // Up to 10 names
  transactions: ITransaction[];
}

const TransactionSchema = new Schema<ITransaction>({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: [{
    member: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  splitAmong: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now }
});

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true },
  members: { 
    type: [String], 
    required: true,
    validate: [arrayLimit, '{PATH} exceeds the limit of 10 members']
  },
  transactions: [TransactionSchema]
}, { timestamps: true });

// Custom validator to enforce your strict rule of up to 10 people
function arrayLimit(val: string[]) {
  return val.length <= 10;
}

// Next.js fast-refresh check: Prevents Mongoose from trying to re-compile the model on code updates
export default mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);