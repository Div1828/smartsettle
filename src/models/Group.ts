import mongoose, { Schema, Document } from "mongoose";

// Structure of a single transaction entry inside the group
export interface ITransaction {
  description: string;
  amount: number;
  paidBy: string;      // Name of the person who paid the bill
  splitAmong: string[]; // Array of names involved in this specific expense
  createdAt: Date;
}

// Structure of the overall Group document
export interface IGroup extends Document {
  name: string;
  members: string[]; // Up to 5 names
  transactions: ITransaction[];
}

const TransactionSchema = new Schema<ITransaction>({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: String, required: true },
  splitAmong: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now }
});

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true },
  members: { 
    type: [String], 
    required: true,
    validate: [arrayLimit, '{PATH} exceeds the limit of 5 members']
  },
  transactions: [TransactionSchema]
}, { timestamps: true });

// Custom validator to enforce your strict rule of up to 5 people
function arrayLimit(val: string[]) {
  return val.length <= 5;
}

// Next.js fast-refresh check: Prevents Mongoose from trying to re-compile the model on code updates
export default mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);