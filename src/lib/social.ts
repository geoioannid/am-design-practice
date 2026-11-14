/** Profile links from settings.yml, in display order; empty fields are skipped. */
export function socialLinks(settings?: {
  instagram?: string;
  linkedin?: string;
  etsy?: string;
}): Array<{ label: string; href: string }> {
  return [
    { label: 'instagram', href: settings?.instagram ?? '' },
    { label: 'linkedin', href: settings?.linkedin ?? '' },
    { label: 'etsy', href: settings?.etsy ?? '' },
  ].filter((l) => l.href);
}
