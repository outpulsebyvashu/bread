import type { Role } from "./roles/index.ts";

// Sample sign-ins for the demo outlet. Only the server-rendered login page reads this file, and only in a
// demo build, so a live build never ships these numbers or PINs to the browser.
export const DEMO_ACCOUNTS: { name: string; role: Role; phone: string; pin: string }[] = [
  { name: "Meera", role: "cashier", phone: "9800000031", pin: "3333" },
  { name: "Asha", role: "captain", phone: "9800000011", pin: "1111" },
  { name: "Rohan", role: "captain", phone: "9800000012", pin: "1112" },
  { name: "Ravi", role: "kitchen", phone: "9800000021", pin: "2222" },
  { name: "Dev", role: "manager", phone: "9800000041", pin: "1234" },
  { name: "Owner", role: "admin", phone: "9800000051", pin: "0000" },
];
