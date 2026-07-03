import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/Group";

export async function PATCH(
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
    const { name, memberName, member } = body;
    const newMemberName = (name || memberName || member || "").trim();

    if (!newMemberName) {
      return NextResponse.json(
        { error: "Member name is required." },
        { status: 400 }
      );
    }

    // Enforce strict limit of 5 members
    if (group.members.length >= 5) {
      return NextResponse.json(
        { error: "Groups are strictly limited to a maximum of 5 members." },
        { status: 400 }
      );
    }

    // Check for duplicates (case-insensitive check or direct string comparison)
    if (group.members.some((m: string) => m.toLowerCase() === newMemberName.toLowerCase())) {
      return NextResponse.json(
        { error: "A member with this name already exists in the group." },
        { status: 400 }
      );
    }

    // Add member
    group.members.push(newMemberName);
    await group.save();

    return NextResponse.json(
      {
        message: "Member added successfully.",
        newMember: newMemberName,
        members: group.members,
        group,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RAW SYSTEM ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add member." },
      { status: 500 }
    );
  }
}
