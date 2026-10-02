import type { Metadata } from "next";
import AdminApp from "./AdminApp";

export const metadata: Metadata = { title: "Ridewallah Admin", description: "Manage rides, drivers, customers, pricing and payments." };

export default function Page() {
  return <AdminApp />;
}
