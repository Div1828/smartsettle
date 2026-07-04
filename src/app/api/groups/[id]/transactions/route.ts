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

    // 1. Description Validation
    if (!description || typeof description !== "string" || description.trim() === "") {
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 }
      );
    }

    // 2. Total Amount Validation
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number." },
        { status: 400 }
      );
    }

    // 3. PaidBy Multi-Payer Validation
    if (!paidBy || !Array.isArray(paidBy) || paidBy.length === 0) {
      return NextResponse.json(
        { error: "Payer contributions list (paidBy) must be a non-empty array." },
        { status: 400 }
      );
    }

    let calculatedSum = 0;
    for (const item of paidBy) {
      if (!item || typeof item !== "object") {
        return NextResponse.json(
          { error: "Each entry in paidBy list must be a valid object." },
          { status: 400 }
        );
      }

      const { member, amount: contributionAmount } = item;
      
      if (!member || typeof member !== "string" || member.trim() === "") {
        return NextResponse.json(
          { error: "Each payer entry must specify a member name." },
          { status: 400 }
        );
      }

      if (!group.members.includes(member)) {
        return NextResponse.json(
          { error: `Payer '${member}' is not a valid group member.` },
          { status: 400 }
        );
      }

      const parsedContribution = Number(contributionAmount);
      if (isNaN(parsedContribution) || parsedContribution < 0) {
        return NextResponse.json(
          { error: `Contribution for '${member}' must be a positive number.` },
          { status: 400 }
        );
      }

      calculatedSum += parsedContribution;
    }

    // Verify sum of contributions equals total amount
    if (Math.abs(calculatedSum - parsedAmount) > 0.01) {
      return NextResponse.json(
        { error: `Sum of individual contributions (₹${calculatedSum.toFixed(2)}) must equal total transaction amount (₹${parsedAmount.toFixed(2)}).` },
        { status: 400 }
      );
    }

    // 4. Split Members Validation
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
      paidBy: paidBy.map((item) => ({
        member: item.member.trim(),
        amount: Number(item.amount),
      })),
      splitAmong: finalSplit,
      createdAt: new Date(),
    };

    group.transactions.push(newTransaction as any);
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
