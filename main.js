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
    const {
      x, left, y, top, width, right, height, bottom
    } = this.getBoundingClientRect();
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
    const
      cx = Math.round((width-(right-left))/2);
  return {
      x, left, y, top, width, right, height, bottom,
      ml, mr, mt, mb,
      pl, pr, pt, pb,
      bl, br, bt, bb,
      lox: left-ml-cx,
      loy: Math.round(y+height/2),
      rox: right+mr+cx,
      roy: Math.round(y+height/2),
    }
  }
}

class RailroadDiagramTerminus extends RailroadElement {
  constructor() {
    super();
  }
}

class RailroadSkip extends RailroadElement {
  constructor() {
    super();
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

class RailroadComment extends RailroadElement {
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

  #isNewLine(x1,y1,x2,y2) {
    return x2-x1 <= 0 && y2-y1 > 0;
  }
  #connectPath(x1,y1,x2,y2) {
    const path = [];
    const dx = x2 - x1, dy = y2 - y1;
    const cx = Math.round(dx/2), cy = Math.round(dy/2);
    if (dy === 0) {
      path.push(`M${x1} ${y1}L${x2} ${y2}`);
    } else if (this.#isNewLine(x1,y1,x2,y2)) {
      path.push(`M${x1} ${y1}v${cy}h${dx}V${y2}`);
    }
    return path
  }
  
  addHandles(s) {
    const path = [];
    path.push(`M${s.lox} ${s.loy}h${s.ml}`);
    path.push(`M${s.rox-s.mr} ${s.roy}h${s.mr}`);
    return path
  }

  draw() {
    console.debug('drawing container');
    const path = [];
    // TODO: path over container border?
    const first = (this instanceof RailroadDiagram || this instanceof RailroadGroup) ? 1 : 0;
    const last = this.children.length - first - 1;
    const ts = this.getShape();
    let prev;
    for (let i = first; i < this.children.length; i++) {
      const child = this.children[i];
      if (child instanceof RailroadContainer) {
        path.push(...child.draw());
      } else if (!(child instanceof RailroadElement)) {
        throw new TypeError(`Invalid element in <railroad-diagram> ${child.tagName}`);
      }

      const cs = child.getShape();
      path.push(...this.addHandles(cs));
      if (i === first) {
        // TODO
      } else if (first !== last) {
        path.push(...this.#connectPath(prev.rox, prev.roy, cs.lox, cs.loy, cs.width, cs.height));
      }
      prev = cs;
      // const { x1, y1, x2, y2 } = child.getConnectors();
      // path.push(`L ${x1} ${y1} L ${x2} ${y2}`);
      // path.push(`L ${Math.round(x1)} ${y1} H ${Math.round(end)}`);
    }
    return path
  }
}

class RailroadSequence extends RailroadContainer {
  constructor() {
    super();
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


class RailroadStack extends RailroadContainer {
  constructor() {
    super();
  }
}

class RailroadDiagram extends RailroadContainer {
  #svg;
  #svgPath;
  #start;
  #end;

  constructor () {
    super();

    this.#start = document.createElement('railroad-diagram-terminus');
    this.prepend(this.#start);
    this.#end = document.createElement('railroad-diagram-terminus');
    this.append(this.#end);

    this.#svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.#svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.#svgPath.setAttribute('stroke-width', 'var(--diagram-stroke-width)');
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
    path.push(...super.draw());
    this.#svgPath.setAttributeNS(null, 'd', path.join(' '));
  }
}

customElements.define('railroad-diagram', RailroadDiagram);
customElements.define('railroad-diagram-terminus', RailroadDiagramTerminus);
customElements.define('railroad-sequence', RailroadSequence);
customElements.define('railroad-group', RailroadGroup);
customElements.define('railroad-stack', RailroadStack);
customElements.define('railroad-container', RailroadContainer);
customElements.define('railroad-comment', RailroadComment);
customElements.define('railroad-nonterminal', RailroadNonTerminal);
customElements.define('railroad-terminal', RailroadTerminal);
customElements.define('railroad-skip', RailroadSkip);
customElements.define('railroad-element', RailroadElement);
