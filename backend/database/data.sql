-- Seed data: two full cycles so predictions work on first load.
-- Cycle 1 starts Mar 3, cycle 2 starts Mar 31 → avg 28 days → next predicted ~Apr 28.

insert into "cycle_entries"
  ("userId", "date", "isPeriod", "notes")
values
  ('demo-user-1', '2026-03-03', true, 'Day 1 — started in the evening'),
  ('demo-user-1', '2026-03-04', true, null),
  ('demo-user-1', '2026-03-05', true, 'Pretty heavy today'),
  ('demo-user-1', '2026-03-06', true, null),
  ('demo-user-1', '2026-03-07', true, 'Almost done'),
  ('demo-user-1', '2026-03-31', true, 'On time this month!'),
  ('demo-user-1', '2026-04-01', true, null),
  ('demo-user-1', '2026-04-02', true, 'Cramping a bit'),
  ('demo-user-1', '2026-04-03', true, null),
  ('demo-user-1', '2026-04-04', true, null);