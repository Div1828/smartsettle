import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/Group";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  try {
    await dbConnect();
    const { id, txId } = await params;

    if (!id || !txId) {
      return NextResponse.json(
        { error: "Group ID and Transaction ID are required." },
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

    // Check if transaction exists
    const txExists = group.transactions.some((t: any) => t._id.toString() === txId);
    if (!txExists) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    // Remove the transaction from the array
    group.transactions.pull(txId);
    await group.save();

    return NextResponse.json({ success: true, message: "Transaction deleted successfully." });
  } catch (error: any) {
    console.error("RAW SYSTEM ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete transaction." },
      { status: 500 }
    );
  }
}
