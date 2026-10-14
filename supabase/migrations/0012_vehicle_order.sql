-- Vehicle order in the apps: Bike, Mini, Sedan, XL, then Auto and E-Rickshaw last. Safe to re-run.
update vehicles set sort = 0 where id = 'bike';
update vehicles set sort = 1 where id = 'mini';
update vehicles set sort = 2 where id = 'sedan';
update vehicles set sort = 3 where id = 'suv';
update vehicles set sort = 4 where id = 'auto';
update vehicles set sort = 5 where id = 'erick';
