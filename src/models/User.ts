import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  xp: number;
  level: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
