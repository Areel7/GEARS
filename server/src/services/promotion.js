import { Member } from "../models/Member.js";
import { CoreTeam } from "../models/CoreTeam.js";
import {
  MEMBER_STATUS,
  REGISTRATION_STATUS,
} from "../constants/enums.js";

/* Placeholder role for an auto-created appointment; the admin edits it. */
export const DEFAULT_CORE_DESIGNATION = "Core Member";

/* ------------------------------------------------------------------
   REGISTRATION -> MEMBER

   Called whenever a registration moves into the "Member" status.
   Idempotent: flipping the status back and forth reuses the same
   Member record instead of creating duplicates.
------------------------------------------------------------------ */

export const syncRegistrationToMember = async (registration) => {
  if (registration.status !== REGISTRATION_STATUS.MEMBER) return null;

  /* 1. Already linked - reactivate if the member was terminated. */
  if (registration.memberId) {
    const linked = await Member.findById(registration.memberId);

    if (linked) {
      if (linked.status === MEMBER_STATUS.TERMINATE) {
        linked.status = MEMBER_STATUS.MEMBER;
        await linked.save();
      }
      return linked;
    }
  }

  /* 2. A member with the same roll number may already exist. */
  const existing = await Member.findOne({
    rollNumber: registration.rollNumber,
  });

  if (existing) {
    if (existing.status === MEMBER_STATUS.TERMINATE) {
      existing.status = MEMBER_STATUS.MEMBER;
    }

    if (!existing.registrationId) {
      existing.registrationId = registration._id;
    }

    await existing.save();

    registration.memberId = existing._id;
    await registration.save();

    return existing;
  }

  /* 3. Create a fresh member from the registration details. */
  const created = await Member.create({
    name: registration.studentName,
    rollNumber: registration.rollNumber,
    phone: registration.phone,
    email: registration.email,
    status: MEMBER_STATUS.MEMBER,
    registrationId: registration._id,
  });

  registration.memberId = created._id;
  await registration.save();

  return created;
};

/* ------------------------------------------------------------------
   MEMBER -> CORE TEAM

   Promoting a member creates (or reactivates) a single active
   appointment. Demoting deactivates it, which removes the member from
   the public team page without deleting the historical record.
------------------------------------------------------------------ */

export const syncMemberToCoreTeam = async (member) => {
  if (member.status === MEMBER_STATUS.CORE_MEMBER) {
    const active = await CoreTeam.findOne({
      member: member._id,
      isActive: true,
    });

    if (active) return active;

    /* Reuse the most recent past appointment if there is one. */
    const previous = await CoreTeam.findOne({ member: member._id }).sort({
      updatedAt: -1,
    });

    if (previous) {
      previous.isActive = true;
      await previous.save();
      return previous;
    }

    return CoreTeam.create({
      member: member._id,
      designation: DEFAULT_CORE_DESIGNATION,
      isActive: true,
    });
  }

  /* Not a core member any more - retire every active appointment. */
  await CoreTeam.updateMany(
    { member: member._id, isActive: true },
    { $set: { isActive: false } }
  );

  return null;
};
