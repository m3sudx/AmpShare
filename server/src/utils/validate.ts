import { z } from "zod";
import { AppError } from "./app-error";

export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.map(String).join(".") || "body"}: ${i.message}`)
      .join("; ");
    throw new AppError(message, 400);
  }
  return result.data;
}
