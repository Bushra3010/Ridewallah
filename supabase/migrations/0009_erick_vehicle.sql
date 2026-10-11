-- E-Rickshaw, step 2 of 2: add it to the catalog between Auto and Mini. Run after 0008. Safe to re-run.
insert into vehicles (id, name, tagline, seats, base, per_km, per_min, min_fare, cancel_fee, eta, enabled, ac_option, parcel_max_kg, sort)
values ('erick', 'E-Rickshaw', 'Electric, quiet and cheap', 4, 20, 7, 1, 30, 15, 3, true, false, 30, 2)
on conflict (id) do nothing;

update vehicles set sort = 3 where id = 'mini';
update vehicles set sort = 4 where id = 'sedan';
update vehicles set sort = 5 where id = 'suv';
