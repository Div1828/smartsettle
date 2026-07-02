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
    return NextResponse.json(
      { error: "Failed to create group" }, 
      { status: 500 }
    );
  }
}