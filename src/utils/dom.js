export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  if (options.html !== undefined) element.innerHTML = options.html;

  for (const [name, value] of Object.entries(options.attributes ?? {})) {
    if (value !== null && value !== undefined) {
      element.setAttribute(name, String(value));
    }
  }

  for (const child of options.children ?? []) {
    if (child !== null && child !== undefined) element.append(child);
  }

  return element;
}

export function replaceChildren(target, children) {
  target.replaceChildren(...children.filter(Boolean));
}
