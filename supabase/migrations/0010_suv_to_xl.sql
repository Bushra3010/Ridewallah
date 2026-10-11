-- Show SUV as "XL" (same vehicle kind, so past rides and riders keep working). Safe to re-run.
update vehicles set name = 'XL', enabled = true where id = 'suv';
