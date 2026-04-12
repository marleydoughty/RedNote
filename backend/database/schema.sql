set client_min_messages to warning;

-- DANGER: this is NOT how to do it in the real world.
-- `drop schema` INSTANTLY ERASES EVERYTHING.
drop schema "public" cascade;

create schema "public";

create table "cycle_entries" (
  "entryId"   serial      primary key,
  "date"      date        not null unique,
  "isPeriod"  boolean     not null default true,
  "notes"     text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
