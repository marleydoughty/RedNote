set client_min_messages to warning;

-- DANGER: this is NOT how to do it in the real world.
-- `drop schema` INSTANTLY ERASES EVERYTHING.
drop schema "public" cascade;

create schema "public";

create table "users" (
  "userId"    serial      primary key,
  "username"  text        not null unique,
  "password"  text        not null,
  "createdAt" timestamptz not null default now()
);

create table "cycle_entries" (
  "entryId"   serial      primary key,
  "userId"    text        not null,
  "date"      date        not null,
  "isPeriod"  boolean     not null default false,
  "notes"     text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("userId", "date")
);