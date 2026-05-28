// Shared TypeScript types — to be expanded as features land.

export type Nullable<T> = T | null;

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: Date;
  updatedAt: Date;
}
