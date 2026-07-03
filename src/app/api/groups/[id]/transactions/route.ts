import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/Group";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required." },
        { status: 400 }
      );
    }

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { description, amount, paidBy, splitAmong, splitBetween } = body;
    const finalSplit = splitAmong || splitBetween;

    // Validation
    if (!description || typeof description !== "string" || description.trim() === "") {
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number." },
        { status: 400 }
      );
    }

    if (!paidBy || typeof paidBy !== "string" || !group.members.includes(paidBy)) {
      return NextResponse.json(
        { error: "Paid By must be a valid group member." },
        { status: 400 }
      );
    }

    if (!finalSplit || !Array.isArray(finalSplit) || finalSplit.length === 0) {
      return NextResponse.json(
        { error: "Split sharing list must be a non-empty array." },
        { status: 400 }
      );
    }

    // Verify all split members are part of the group
    const invalidMembers = finalSplit.filter((m) => !group.members.includes(m));
    if (invalidMembers.length > 0) {
      return NextResponse.json(
        { error: `Invalid group members in split list: ${invalidMembers.join(", ")}` },
        { status: 400 }
      );
    }

    // Add transaction to group
    const newTransaction = {
      description: description.trim(),
      amount: parsedAmount,
      paidBy: paidBy,
      splitAmong: finalSplit,
      createdAt: new Date(),
    };

    group.transactions.push(newTransaction);
    await group.save();

    const addedTx = group.transactions[group.transactions.length - 1];

    return NextResponse.json(addedTx, { status: 201 });
  } catch (error: any) {
    console.error("RAW SYSTEM ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add transaction." },
      { status: 500 }
    );
  }
}
