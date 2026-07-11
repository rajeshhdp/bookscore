import type { Metadata } from "next";
import { getBooks } from "@/lib/queries";
import { BooksManager } from "./books-manager";

export const metadata: Metadata = { title: "Manage Books" };

export default async function AdminBooksPage() {
  const books = await getBooks(true);
  return <BooksManager books={books} />;
}
