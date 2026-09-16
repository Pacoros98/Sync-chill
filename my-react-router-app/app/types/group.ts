export type Group = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  memberNames: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
};

export type InviteStatus = "pending" | "accepted" | "declined";

export type GroupInvite = {
  id: string;
  groupId: string;
  groupName: string;
  toUserId: string;
  toUserNameLower: string;
  invitedBy: string;
  invitedByName: string;
  status: InviteStatus;
  createdAt?: Date;
};
