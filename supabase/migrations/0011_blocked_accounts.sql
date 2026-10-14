-- Blocked customers can no longer edit their profile or saved places directly (the server actions refuse too).
-- Suspended riders already cannot go online (see the go online policy). Safe to re-run.

drop policy if exists "edit own profile" on customers;
create policy "edit own profile" on customers for update to authenticated
  using (user_id = auth.uid() and blocked = false) with check (user_id = auth.uid() and blocked = false);

drop policy if exists "own places" on places;
create policy "own places" on places for all to authenticated
  using (customer_id = public.my_customer_id())
  with check (customer_id = public.my_customer_id()
    and not exists (select 1 from customers c where c.id = places.customer_id and c.blocked));
