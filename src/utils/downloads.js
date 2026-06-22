export function downloadTextFile({ filename, text, type = "text/plain;charset=utf-8", documentObject = globalThis.document, urlObject = globalThis.URL }) {
  if (!documentObject?.body || !urlObject?.createObjectURL) {
    throw new Error("Ta przeglądarka nie obsługuje pobierania plików.");
  }
  const blob = new Blob([text], { type });
  const url = urlObject.createObjectURL(blob);
  const link = documentObject.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  documentObject.body.append(link);
  link.click();
  link.remove();
  globalThis.setTimeout(() => urlObject.revokeObjectURL(url), 0);
}
