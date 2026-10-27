import type { BoxModel, InspectedElement } from '../types';
import { generateAiPrompt } from '../utils/tokenGenerators';

export class ElementInspector {
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private overlay: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private activeElement: HTMLElement | null = null;
  private isInspecting = false;
  private onSelectCallback: (element: InspectedElement) => void;

  constructor(onSelect: (element: InspectedElement) => void) {
    this.onSelectCallback = onSelect;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  public start() {
    if (this.isInspecting) return;
    this.isInspecting = true;
    this.createDom();

    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
  }

  public stop() {
    if (!this.isInspecting) return;
    this.isInspecting = false;

    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);

    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadow = null;
    }
  }

  private createDom() {
    if (this.host) return;

    this.host = document.createElement('div');
    this.host.id = 'zippix-inspector-root';
    this.host.style.position = 'fixed';
    this.host.style.top = '0';
    this.host.style.left = '0';
    this.host.style.width = '0';
    this.host.style.height = '0';
    this.host.style.zIndex = '2147483647';
    this.host.style.pointerEvents = 'none';

    this.shadow = this.host.attachShadow({ mode: 'open' });

    // Styles inside shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      .zippix-highlight {
        position: fixed;
        border: 2px solid #06b6d4;
        background: rgba(6, 182, 212, 0.12);
        box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
        border-radius: 2px;
        transition: all 0.05s ease-out;
        pointer-events: none;
        z-index: 2147483647;
      }
      .zippix-tooltip {
        position: fixed;
        background: #090d16;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        font-weight: 500;
        padding: 5px 9px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.15);
        box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 2147483647;
      }
      .zippix-tag {
        color: #38bdf8;
        font-weight: 700;
      }
      .zippix-dim {
        color: #94a3b8;
      }
    `;

    this.overlay = document.createElement('div');
    this.overlay.className = 'zippix-highlight';

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'zippix-tooltip';

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.overlay);
    this.shadow.appendChild(this.tooltip);

    document.documentElement.appendChild(this.host);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isInspecting) return;

    const target = e.target as HTMLElement;
    if (!target || target === this.host || this.host?.contains(target)) return;

    this.activeElement = target;
    const rect = target.getBoundingClientRect();

    if (this.overlay && this.tooltip) {
      this.overlay.style.top = `${rect.top}px`;
      this.overlay.style.left = `${rect.left}px`;
      this.overlay.style.width = `${rect.width}px`;
      this.overlay.style.height = `${rect.height}px`;

      // Tooltip position
      let tooltipTop = rect.top - 32;
      if (tooltipTop < 10) tooltipTop = rect.bottom + 8;
      let tooltipLeft = rect.left;
      if (tooltipLeft + 200 > window.innerWidth) tooltipLeft = window.innerWidth - 210;

      this.tooltip.style.top = `${Math.max(8, tooltipTop)}px`;
      this.tooltip.style.left = `${Math.max(8, tooltipLeft)}px`;

      const classes = target.className && typeof target.className === 'string'
        ? `.${target.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '';

      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      this.tooltip.innerHTML = `
        <span class="zippix-tag">&lt;${target.tagName.toLowerCase()}${classes}&gt;</span>
        <span class="zippix-dim">${w} × ${h}px</span>
      `;
    }
  }

  private handleClick(e: MouseEvent) {
    if (!this.isInspecting || !this.activeElement) return;

    e.preventDefault();
    e.stopPropagation();

    const el = this.activeElement;
    const inspected = this.extractElementDetails(el);
    this.onSelectCallback(inspected);

    // Stop inspecting once clicked
    this.stop();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.stop();
    }
  }

  private extractElementDetails(el: HTMLElement): InspectedElement {
    const comp = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const boxModel: BoxModel = {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      margin: {
        top: parseFloat(comp.marginTop) || 0,
        right: parseFloat(comp.marginRight) || 0,
        bottom: parseFloat(comp.marginBottom) || 0,
        left: parseFloat(comp.marginLeft) || 0,
      },
      padding: {
        top: parseFloat(comp.paddingTop) || 0,
        right: parseFloat(comp.paddingRight) || 0,
        bottom: parseFloat(comp.paddingBottom) || 0,
        left: parseFloat(comp.paddingLeft) || 0,
      },
      border: {
        top: parseFloat(comp.borderTopWidth) || 0,
        right: parseFloat(comp.borderRightWidth) || 0,
        bottom: parseFloat(comp.borderBottomWidth) || 0,
        left: parseFloat(comp.borderLeftWidth) || 0,
      },
    };

    const classList = Array.from(el.classList);
    const cleanHtml = this.cleanElementHtml(el);
    const tailwindGuess = this.guessTailwindClasses(comp);

    const inspected: InspectedElement = {
      tagName: el.tagName,
      id: el.id,
      classList,
      selectorPath: this.getSelectorPath(el),
      boxModel,
      computedStyles: {
        color: comp.color,
        backgroundColor: comp.backgroundColor,
        fontFamily: comp.fontFamily.split(',')[0].replace(/['"]/g, ''),
        fontSize: comp.fontSize,
        fontWeight: comp.fontWeight,
        lineHeight: comp.lineHeight,
        display: comp.display,
        position: comp.position,
        borderRadius: comp.borderRadius,
        boxShadow: comp.boxShadow,
        border: `${comp.borderWidth} ${comp.borderStyle} ${comp.borderColor}`,
        opacity: comp.opacity,
        zIndex: comp.zIndex,
      },
      html: el.outerHTML,
      cleanHtml,
      tailwindGuess,
      aiPrompt: '',
    };

    inspected.aiPrompt = generateAiPrompt(inspected);
    return inspected;
  }

  private cleanElementHtml(el: HTMLElement): string {
    const clone = el.cloneNode(true) as HTMLElement;
    // Strip scripts, heavy svgs or sensitive data
    clone.querySelectorAll('script, style').forEach((s) => s.remove());
    return clone.outerHTML.slice(0, 4000); // Limit size for snappy AI handling
  }

  private guessTailwindClasses(comp: CSSStyleDeclaration): string {
    const classes: string[] = [];

    // Display & Flex
    if (comp.display === 'flex') {
      classes.push('flex');
      if (comp.flexDirection === 'column') classes.push('flex-col');
      if (comp.alignItems === 'center') classes.push('items-center');
      if (comp.justifyContent === 'center') classes.push('justify-center');
      if (comp.justifyContent === 'space-between') classes.push('justify-between');
    } else if (comp.display === 'grid') {
      classes.push('grid');
    } else if (comp.display === 'inline-flex') {
      classes.push('inline-flex items-center');
    }

    // Border Radius
    const r = parseFloat(comp.borderRadius) || 0;
    if (r > 999) classes.push('rounded-full');
    else if (r >= 16) classes.push('rounded-2xl');
    else if (r >= 12) classes.push('rounded-xl');
    else if (r >= 8) classes.push('rounded-lg');
    else if (r >= 4) classes.push('rounded');

    // Font weight
    const fw = parseInt(comp.fontWeight, 10);
    if (fw >= 700) classes.push('font-bold');
    else if (fw >= 600) classes.push('font-semibold');
    else if (fw >= 500) classes.push('font-medium');

    // Transitions & Shadow
    if (comp.boxShadow && comp.boxShadow !== 'none') classes.push('shadow-md');
    if (comp.transition && comp.transition !== 'all 0s ease 0s') classes.push('transition duration-200');

    return classes.join(' ');
  }

  private getSelectorPath(el: HTMLElement): string {
    const names: string[] = [];
    let current: HTMLElement | null = el;

    while (current && current.nodeType === Node.ELEMENT_NODE && names.length < 4) {
      let name = current.tagName.toLowerCase();
      if (current.id) {
        name += `#${current.id}`;
        names.unshift(name);
        break;
      }
      if (current.className && typeof current.className === 'string') {
        const cls = current.className.trim().split(/\s+/)[0];
        if (cls) name += `.${cls}`;
      }
      names.unshift(name);
      current = current.parentElement;
    }

    return names.join(' > ');
  }
}
