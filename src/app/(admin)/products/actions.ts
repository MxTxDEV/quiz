"use server";

import { revalidatePath } from "next/cache";
import { assertUser } from "@/lib/auth/session";
import { run } from "@/lib/actions/result";
import { createProduct, deleteProduct, updateProduct, type ProductInput } from "@/lib/services/products";

export async function saveProductAction(id: string | null, input: ProductInput) {
  return run("products.save", async () => {
    await assertUser("editor");
    const row = id ? await updateProduct(id, input) : await createProduct(input);
    if (!row) throw new Error("Produto não encontrado.");
    revalidatePath("/products");
    return { id: row.id };
  });
}

export async function deleteProductAction(id: string) {
  return run("products.delete", async () => {
    await assertUser("editor");
    await deleteProduct(id);
    revalidatePath("/products");
  });
}
