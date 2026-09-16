import { useEffect, useMemo, useState } from "react";
import {
  createGroup,
  deleteGroup,
  removeMember,
  renameGroup,
  respondToInvite,
  sendInvite,
  subscribeToMyInvites,
  subscribeToUserGroups,
} from "../../lib/groups";
import { findUserByUsername } from "../../lib/usernames";
import type { Group, GroupInvite } from "../../types/group";

type GroupsPanelProps = {
  userId: string;
  userName: string;
};

export default function GroupsPanel({ userId, userName }: GroupsPanelProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUserGroups(userId, setGroups, (err) =>
      console.error("Unable to load groups.", err)
    );
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    const unsubscribe = subscribeToMyInvites(userId, setInvites, (err) =>
      console.error("Unable to load invites.", err)
    );
    return unsubscribe;
  }, [userId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) {
      setError("Group name is required.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      await createGroup(userId, userName, name);
      setNewGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create group.");
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedGroup) {
      return;
    }

    const usernameLower = inviteUsername.trim().toLowerCase();
    if (!usernameLower) {
      setError("Enter a user name to invite.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const user = await findUserByUsername(usernameLower);
      if (!user) {
        setError("No user found with that name.");
        return;
      }

      if (selectedGroup.memberIds.includes(user.uid)) {
        setError("That user is already a member.");
        return;
      }

      await sendInvite(selectedGroup, user, userId, userName);
      setInviteUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send invite.");
    } finally {
      setBusy(false);
    }
  };

  const handleRespondToInvite = async (invite: GroupInvite, accept: boolean) => {
    setError("");
    try {
      await respondToInvite(invite, accept, userName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to respond to invite.");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) {
      return;
    }
    try {
      await removeMember(selectedGroup.id, memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove member.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) {
      return;
    }
    const confirmed = window.confirm(`Delete group "${selectedGroup.name}"?`);
    if (!confirmed) {
      return;
    }
    try {
      await deleteGroup(selectedGroup.id);
      setSelectedGroupId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete group.");
    }
  };

  return (
    <div className="groups-layout">
      <section className="groups-sidebar">
        <div className="groups-create">
          <label htmlFor="new-group-name">New group</label>
          <input
            id="new-group-name"
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            maxLength={60}
          />
          <button type="button" onClick={handleCreateGroup} disabled={busy}>
            Create group
          </button>
        </div>

        <ul className="groups-list">
          {groups.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                className={[
                  "groups-list-item",
                  group.id === selectedGroupId ? "groups-list-item--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <span>{group.name}</span>
                <span className="groups-list-count">{group.memberIds.length}</span>
              </button>
            </li>
          ))}
          {groups.length === 0 && <li className="groups-empty">No groups yet.</li>}
        </ul>

        {invites.length > 0 && (
          <div className="groups-invites">
            <p className="selected-date-label">My invites</p>
            <ul className="groups-invites-list">
              {invites.map((invite) => (
                <li key={invite.id} className="groups-invite-item">
                  <p>
                    <strong>{invite.invitedByName}</strong> invited you to{" "}
                    <strong>{invite.groupName}</strong>
                  </p>
                  <div className="groups-invite-actions">
                    <button type="button" onClick={() => handleRespondToInvite(invite, true)}>
                      Accept
                    </button>
                    <button
                      type="button"
                      className="day-event-delete"
                      onClick={() => handleRespondToInvite(invite, false)}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="groups-detail">
        {error && <div className="error-message">{error}</div>}

        {!selectedGroup ? (
          <p className="day-events-empty">Select or create a group to view its details.</p>
        ) : (
          <>
            <div className="groups-detail-header">
              <h3>{selectedGroup.name}</h3>
              {selectedGroup.ownerId === userId && (
                <button type="button" className="day-event-delete" onClick={handleDeleteGroup}>
                  Delete group
                </button>
              )}
            </div>

            <ul className="day-events-list">
              {selectedGroup.memberIds.map((memberId) => (
                <li key={memberId} className="day-event-item">
                  <p className="day-event-title">
                    {selectedGroup.memberNames[memberId] ?? memberId}
                    {memberId === selectedGroup.ownerId && " (owner)"}
                  </p>
                  {selectedGroup.ownerId === userId && memberId !== userId && (
                    <button
                      type="button"
                      className="day-event-delete"
                      onClick={() => handleRemoveMember(memberId)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="groups-invite-form">
              <label htmlFor="invite-username">Invite by user name</label>
              <div className="groups-invite-form-row">
                <input
                  id="invite-username"
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Enter a user name"
                />
                <button type="button" onClick={handleInvite} disabled={busy}>
                  Invite
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
