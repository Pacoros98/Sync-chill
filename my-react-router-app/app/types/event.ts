export type CalendarEvent = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  groupId: string | null;
  participantIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type CalendarEventInput = {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  groupId?: string | null;
  participantIds?: string[];
};
