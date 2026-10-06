import type { Metadata } from "next";
import AdminApp from "./AdminApp";
import { getCatalog } from "../lib/catalog";
import { CatalogProvider } from "../lib/CatalogProvider";

export const metadata: Metadata = { title: "Ridewallah Admin", description: "Manage rides, drivers, customers, pricing and payments." };

// Admins always see the live catalog, including inactive coupons.
export const revalidate = 0;

export default async function Page() {
  const catalog = await getCatalog({ asAdmin: true });
  return (
    <CatalogProvider catalog={catalog}>
      <AdminApp />
    </CatalogProvider>
  );
}
