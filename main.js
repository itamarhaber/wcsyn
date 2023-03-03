function fromPx(s) { return Number(s.slice(0,-2)) }

class RailroadElement extends HTMLElement {
  constructor () {
    super();
  }

  connectedCallback() {
    // this.parentElement.draw();
  }

  disconnectedCallback() {
    this.dispatchEvent(new Event('disconnect'));
  }

  getShape() {
    const { x, left, y, top, width, right, height, bottom } = this.getBoundingClientRect();
    // TODO: always px?
    const {
      marginLeft, marginRight, marginTop, marginBottom,
      paddingLeft, paddingRight, paddingTop, paddingBottom,
      borderLeftWidth, borderRightWidth, borderTopWidth, borderBottomWidth,
    } = this.currentStyle || window.getComputedStyle(this);
    const 
    ml = fromPx(marginLeft), mr = fromPx(marginRight), mt = fromPx(marginTop), mb = fromPx(marginBottom),
    pl = fromPx(paddingLeft), pr = fromPx(paddingRight), pt = fromPx(paddingTop), pb = fromPx(paddingBottom),
    bl = fromPx(borderLeftWidth), br = fromPx(borderRightWidth), bt = fromPx(borderTopWidth), bb = fromPx(borderBottomWidth);
  return {
      x, left, y, top, width, right, height, bottom,
      ml, mr, mt, mb,
      pl, pr, pt, pb,
      bl, br, bt, bb,
      lox: Math.round(left-ml-(width-(right-left))/2),
      loy: Math.round(y+height/2),
      rox: Math.round(right+mr+(width-(right-left))/2),
      roy: Math.round(y+height/2),
    }
  }
}

class RailroadTerminal extends RailroadElement {
  constructor() {
    super();
  }
}

class RailroadNonTerminal extends RailroadElement {
  constructor() {
    super();
  }
}

class RailroadContainer extends RailroadElement {
  constructor () {
    super();
  }

  connectedCallback() {
    this.addEventListener('connect', ({ event: { target }}) => {
      this.draw();
      target.addEventListener('disconnect', () => this.draw()); // TODO: once
    });
  }

  disconnectedCallback() {
    console.debug('RailroadElement disconnectedCallback');
  }

  draw() {
    console.debug('drawing container');
    const path = [];
    const first = (this instanceof RailroadDiagram || this instanceof RailroadGroup) ? 1 : 0;
    for (let i = first; i < this.children.length; i++) {
      const child = this.children[i];
      if (!(child instanceof RailroadElement)) {
        throw new TypeError(`Invalid element in <railroad-diagram> ${child.tagName}`);
      }
      const s = child.getShape();
      // Draw child connectors
      path.push(`M${s.lox-2} ${s.loy}h${s.ml+4}`);
      path.push(`M${s.rox-s.mr-2} ${s.roy}h${s.mr+4}`);
      if (child instanceof RailroadContainer) path.push(...child.draw());
      // const { x1, y1, x2, y2 } = child.getConnectors();
      // path.push(`L ${x1} ${y1} L ${x2} ${y2}`);
      // path.push(`L ${Math.round(x1)} ${y1} H ${Math.round(end)}`);
    }
    return path
  }
}

class RailroadGroup extends RailroadContainer {
  #label
  constructor() {
    super();
    this.#label = document.createElement('span');
    this.#label.textContent = this.getAttribute('text') || '';
    this.prepend(this.#label);
  }
}

class RailroadDiagram extends RailroadContainer {
  #svg;
  #svgPath;

  constructor () {
    super();
    this.#svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.#svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.#svgPath.setAttribute('stroke-width', 'var(--diagram-stroke-width');
    this.#svgPath.setAttribute('stroke', 'currentColor');
    this.#svgPath.setAttribute('fill', 'transparent');
    this.#svg.appendChild(this.#svgPath);
    this.prepend(this.#svg);
  }

  connectedCallback() {
    super.connectedCallback(); // LEIBALE HELP!P!
    customElements.whenDefined('railroad-element')
      .then(() => setTimeout(() => this.draw()));
    window.addEventListener('resize',() => this.draw());
  }

  disconnectedCallback() {
    console.debug('RailroadDiagram disconnectedCallback');
  }

  draw() {
    console.debug('drawing diagram');
    const s = this.getShape();
    this.#svg.setAttribute('viewBox', `${s.left} ${s.top} ${s.width} ${s.height}`);
    const path = [];

    // path.push(`M${s.left} ${s.top}v20m10 -20v20m-10 -10h20`); // Diagram start |-|--
    path.push(...super.draw());
    // path.push(`M${s.right} ${s.bottom} h 20 m -10 -10 v 20 m 10 -20 v 20`); // Diagram end --|-|
    this.#svgPath.setAttributeNS(null, 'd', path.join(' '));
  }
}

customElements.define('railroad-diagram', RailroadDiagram);
customElements.define('railroad-group', RailroadGroup);
customElements.define('railroad-container', RailroadContainer);
customElements.define('railroad-nonterminal', RailroadNonTerminal);
customElements.define('railroad-terminal', RailroadTerminal);
customElements.define('railroad-element', RailroadElement);
