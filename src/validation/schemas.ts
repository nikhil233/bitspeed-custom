import { z } from 'zod';

export const identifyRequestSchema = z.object({
  email: z.union([z.string().email(), z.null(), z.undefined()]).optional(),
  phoneNumber: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
}).refine((data) => {
  // Check if at least one of email or phoneNumber has a non-null, non-undefined value
  const hasEmail = data.email && data.email !== null && data.email !== undefined;
  const hasPhone = data.phoneNumber && data.phoneNumber !== null && data.phoneNumber !== undefined;
  return hasEmail || hasPhone;
}, {
  message: "At least one of email or phoneNumber must be provided",
});

export type ValidatedIdentifyRequest = z.infer<typeof identifyRequestSchema>; 