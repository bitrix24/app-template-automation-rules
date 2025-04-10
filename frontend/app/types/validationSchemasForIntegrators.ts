/**
 * @todo add lang
 */
import { z } from 'zod'

export const stepSchemas = {
  1: z.object({
    logo: z.string().optional(),
    company: z.string()
      .min(2, 'Company name must be at least 2 characters')
      .max(100, 'Company name too long (max 100 characters)')
  }),
  2: z.object({
    phone: z.string()
      .max(20, 'Phone number too long')
      .optional()
      .transform(val => val?.replace(/[\s.-]/g, '')),
    email: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          const trimmed = val.trim()
          return trimmed === '' ? undefined : trimmed
        }
        return val
      },
      z.string()
        .email('Invalid e-mail address')
        .max(60, 'E-mail too long')
        .optional()
    )
  }),
  3: z.object({
    whatsapp: z.string()
      .max(60, 'Whatsapp too long')
      .optional(),
    telegram: z.string()
      .max(60, 'Telegram too long')
      .optional(),
    site: z.string()
      .max(60, 'URL too long')
      .optional()
  }),
  4: z.object({
    comments: z.string()
      .max(200, 'Comments too long (max 200 characters)')
      .optional()
  })
}

export const fullSchema = z.object({
  ...stepSchemas[1].shape,
  ...stepSchemas[2].shape,
  ...stepSchemas[3].shape,
  ...stepSchemas[4].shape
})

export type Schema = z.infer<typeof fullSchema>
