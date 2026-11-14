/** Grid filter categories, in display order. Must match the `category` select options in public/admin/config.yml. */
export const CATEGORIES = ['Architecture', 'Interior', 'Furniture'] as const;
export type Category = (typeof CATEGORIES)[number];
