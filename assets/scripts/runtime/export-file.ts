/** Web-mobile JSON export with a clipboard fallback. */

export type ExportFileResult = 'download' | 'clipboard' | 'failed';

export async function exportJsonFile(filename: string, text: string): Promise<ExportFileResult> {
  let objectUrl: string | null = null;
  try {
    const blob = new Blob([text], { type: 'application/json' });
    objectUrl = globalThis.URL.createObjectURL(blob);
    const anchor = globalThis.document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    return 'download';
  } catch {
    // Native shells and restricted browsers may not expose the DOM download path.
  } finally {
    if (objectUrl !== null) {
      try {
        globalThis.URL.revokeObjectURL(objectUrl);
      } catch {
        // Revocation is best-effort and must not suppress the clipboard fallback.
      }
    }
  }

  try {
    await globalThis.navigator.clipboard.writeText(text);
    return 'clipboard';
  } catch {
    return 'failed';
  }
}
