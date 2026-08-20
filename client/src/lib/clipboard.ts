export async function copyText(writeText: ((value: string) => Promise<void>) | undefined, value: string): Promise<boolean> {
  if (!writeText) return false;
  try {
    await writeText(value);
    return true;
  } catch {
    return false;
  }
}
