import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/Group";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, members } = body;

    // Ensure we don't exceed the 5 member limit before hitting Mongoose
    if (!members || members.length > 5) {
      return NextResponse.json(
        { error: "A group can have a maximum of 5 members." }, 
        { status: 400 }
      );
    }

    const group = await Group.create({ name, members, transactions: [] });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("RAW SYSTEM ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create group" }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    // Fetch all groups, sorted by createdAt descending
    const groups = await Group.find({}).sort({ createdAt: -1 });
    return NextResponse.json(groups, { status: 200 });
  } catch (error) {
    console.error("RAW SYSTEM ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}