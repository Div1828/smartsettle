import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/Group";

export async function GET(
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

    return NextResponse.json(group, { status: 200 });
  } catch (error: any) {
    console.error("RAW SYSTEM ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch group." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const deletedGroup = await Group.findByIdAndDelete(id);

    if (!deletedGroup) {
      return NextResponse.json(
        { error: "Group not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Group deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RAW SYSTEM ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete group." },
      { status: 500 }
    );
  }
}
