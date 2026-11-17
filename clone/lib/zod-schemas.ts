import { z } from "zod";

// Validação de entrada do servidor para toda rota de /api — nenhuma rota confia em dados
// vindos do navegador sem passar por aqui primeiro (checklist de segurança do backend.md).

export const quoteInputSchema = z.object({
  fulfillment: z.enum(["delivery", "pickup", "dine_in"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        notes: z.string().max(280).optional().default(""),
        optionIds: z.array(z.string()).max(50).optional().default([]),
      }),
    )
    .min(1)
    .max(50),
});

export const createOrderSchema = quoteInputSchema.extend({
  customer: z.object({
    phone: z.string().regex(/^[0-9]{10,13}$/, "WhatsApp inválido."),
    name: z.string().trim().min(2).max(120),
  }),
  idempotencyKey: z.string().min(8).max(100),
});

export const customerSchema = z.object({
  phone: z.string().regex(/^[0-9]{10,13}$/, "Informe um WhatsApp válido, com DDD."),
  name: z.string().trim().min(2, "Informe seu nome e sobrenome.").max(120),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "awaiting_payment",
    "received",
    "accepted",
    "preparing",
    "ready",
    "out_for_delivery",
    "completed",
    "cancelled",
    "rejected",
  ]),
});

export const storePatchSchema = z.object({
  slug: z.string().min(1),
  autoPrint: z.boolean().optional(),
});
