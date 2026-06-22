try {
  const saved = JSON.parse(localStorage.getItem("sagSetupLogbookWeb.settings.v1") || "null");
  if (saved && (saved.appearanceMode === "light" || saved.appearanceMode === "dark")) {
    document.documentElement.dataset.theme = saved.appearanceMode;
  }
} catch {
  // Ustawienia wyglądu są opcjonalne. Aplikacja użyje motywu systemowego.
}
