/**
 * High-reliability SVG extractor and cleaner
 */
export function cleanAndSerializeSvg(svgEl: SVGElement): string {
  const clone = svgEl.cloneNode(true) as SVGElement;

  // Ensure xmlns is present
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  // If viewBox is missing, infer from width/height or bounding box
  if (!clone.getAttribute('viewBox')) {
    const width = clone.getAttribute('width') || String(svgEl.getBoundingClientRect().width || 24);
    const height = clone.getAttribute('height') || String(svgEl.getBoundingClientRect().height || 24);
    const cleanW = parseFloat(width) || 24;
    const cleanH = parseFloat(height) || 24;
    clone.setAttribute('viewBox', `0 0 ${cleanW} ${cleanH}`);
  }

  // Resolve <use href="#id"> if any
  const uses = clone.querySelectorAll('use');
  uses.forEach((use) => {
    const href = use.getAttribute('href') || use.getAttribute('xlink:href');
    if (href && href.startsWith('#')) {
      const targetId = href.slice(1);
      const symbolOrDef = document.getElementById(targetId);
      if (symbolOrDef) {
        const symbolClone = symbolOrDef.cloneNode(true) as Element;
        // If it's a <symbol>, convert to <g> to preserve rendering
        if (symbolClone.tagName.toLowerCase() === 'symbol') {
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          while (symbolClone.firstChild) {
            g.appendChild(symbolClone.firstChild);
          }
          use.replaceWith(g);
        } else {
          use.replaceWith(symbolClone);
        }
      }
    }
  });

  // Remove unwanted attributes and scripts
  clone.removeAttribute('aria-hidden');
  const scripts = clone.querySelectorAll('script');
  scripts.forEach((s) => s.remove());

  // Serialize to string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Clean extra whitespace
  svgString = svgString.replace(/\s+/g, ' ').trim();

  return svgString;
}

export function svgToDataUri(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
