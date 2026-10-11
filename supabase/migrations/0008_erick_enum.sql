-- E-Rickshaw, step 1 of 2: add the vehicle kind. Safe to re-run.
-- Run this on its own first: Postgres will not let the same run also insert a row using the new value.
alter type vehicle_kind add value if not exists 'erick' after 'auto';
