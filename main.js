function fromPx(s) { return Number(s.slice(0,-2)) }

class Path {
  #x;

  get x() {
    return this.#x;
  }

  set x(x) {
    this.#x = x;
    this.moveTo(this.#x, this.#y);
  }

  #y;

  get y() {
    return this.#y;
  }

  set y(y) {
    this.#y = y;
    this.moveTo(this.#x, this.#y);
  }

  #path2d = new Path2D();

  get path2d() {
    return this.#path2d;
  }

  #canvas;
  #AR;

  constructor(arcRadius, lineWidth) {
    this.#AR = arcRadius;
  }

  moveTo(x, y) {
    this.#x = x;
    this.#y = y;
    this.#path2d.moveTo(x, y);
  }

  lineTo(x, y) {
    this.#x = x;
    this.#y = y;
    this.#path2d.lineTo(x, y);
  }

  verticalTo(y) {
    this.#y = y;
    this.#path2d.lineTo(this.#x, y);
  }

  horizontalTo(x) {
    this.#x = x;
    this.#path2d.lineTo(x, this.#y);
  }
}

class RailroadElement extends HTMLElement {
  connectedCallback() {
    // this.parentElement.draw();
  }

  disconnectedCallback() {
    // this.dispatchEvent(new Event('disconnect'));
  }

  #drawOptional(path, gap) {
    if (!this.hasAttribute('optional')) return;

    const { x, y } = path;
    path.verticalTo(this.offsetTop - gap.block);
    path.horizontalTo(this.offsetLeft + this.offsetWidth + gap.midInline);
    path.verticalTo(y);
    path.x = x;
  }

  #drawRepeatable(path, gap) {
    if (!this.hasAttribute('repeatable')) return;

    const { x, y } = path;
    path.verticalTo(this.offsetTop + this.offsetHeight + gap.block);
    path.horizontalTo(this.offsetLeft + this.offsetWidth + gap.midInline);
    path.verticalTo(y);
    path.x = x;
  }

  drawAttributes(path, gap) {
    this.#drawOptional(path, gap);
    this.#drawRepeatable(path, gap);
  }

  draw(path, gap) {
    const { x, midHeight, width } = this.getRect();
    path.lineTo(x + 1, midHeight);
    path.x += width - 2;
    path.horizontalTo(path.x + gap.midInline + 1);
  }

  getRect() {
    return {
      x: this.offsetLeft,
      y: this.offsetTop,
      width: this.offsetWidth,
      height: this.offsetHeight,
      midHeight: this.offsetTop + Math.floor(this.offsetHeight / 2)
    };
  }
}

class RailroadStart extends RailroadElement {}

class RailroadEnd extends RailroadElement {}

class RailroadTerminal extends RailroadElement {}

class RailroadNonterminal extends RailroadElement {}

class RailroadContainer extends RailroadElement {
  connectedCallback() {
    if (!this.children.length) {
      throw new TypeError(`<${this.tagName.toLocaleLowerCase()}> must contain at least one element`);
    }

    this.addEventListener('connect', ({ event: { target }}) => {
      this.draw();
      target.addEventListener('disconnect', () => this.draw()); // TODO: once
    });
  }

  disconnectedCallback() {
    console.debug('RailroadElement disconnectedCallback');
  }

  getRect() {
    return this.children[0].getRect();
  }

  getGap() {
    const computedStyle = getComputedStyle(this),
      block = fromPx(computedStyle['row-gap']),
      inline = fromPx(computedStyle['column-gap']);
    return {
      block: Math.round(block),
      inline: Math.round(inline),
      midBlock: Math.round(block / 2),
      midInline: Math.round(inline / 2)
    };
  }
}

class RailroadSequence extends RailroadContainer {
  draw(path, gap, start = 0) {
    let lineHeight = 0;
    for (let i = start; i < this.children.length; i++) {
      const child = this.children[i],
        { midHeight } = child.getRect();

      if (path.x > child.offsetLeft) {
        let prev = this.children[i-1];
        path.horizontalTo(prev.offsetLeft + prev.offsetWidth + gap.inline);
        path.verticalTo(prev.offsetTop + lineHeight + gap.midBlock);
        path.horizontalTo(child.offsetLeft - gap.inline);
        path.verticalTo(midHeight);
        path.horizontalTo(child.offsetLeft - gap.midInline);
        lineHeight = child.offsetHeight;
      } else if (child.offsetHeight > lineHeight) {
        lineHeight = child.offsetHeight;
      }

      child.drawAttributes(path, gap);
      child.draw(path, gap);
    }
  }
}

class RailroadChoice extends RailroadContainer {
  draw(path, gap) {
    const { x, y } = path;
    for (const child of this.children) {
      path.verticalTo(child.getRect().midHeight);
      child.drawAttributes(path, gap);
      child.draw(path, gap);
      path.horizontalTo(this.offsetLeft + this.offsetWidth + gap.midInline);
      path.verticalTo(y);
      path.x = x;
    }

    path.x += this.offsetWidth + gap.inline;
  }
}

class RailroadDiagram extends RailroadSequence {
  #canvas;
  #ctx;

  constructor() {
    super();
    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d');
    this.prepend(this.#canvas);
  }

  connectedCallback() {
    Promise.all(
      ELEMENTS.map(({ name }) => customElements.whenDefined(name))
    ).then(() => {
      setTimeout(() => this.draw());
      // TODO: remove listener
      window.addEventListener('resize', () => this.draw());
    });
  }

  disconnectedCallback() {
    console.debug('RailroadDiagram disconnectedCallback');
  }

  draw() {
    this.#canvas.width = this.clientWidth * devicePixelRatio;
    this.#canvas.height = this.clientHeight * devicePixelRatio;

    this.#canvas.style.width = `${this.clientWidth}px`;
    this.#canvas.style.height = `${this.clientHeight}px`;

    const computedStyle = getComputedStyle(this);
    const arcRadius = fromPx(computedStyle.getPropertyValue('--arc-radius')) || 8;
    const lineWidth = fromPx(computedStyle.getPropertyValue('--line-width')) || 4;

    const path = new Path(this.#canvas, arcRadius);
    super.draw(path, this.getGap(), 1);
    
    // TODO: use css custome property - should be the same as borders
    this.#ctx.lineWidth = lineWidth;
    this.#ctx.scale(devicePixelRatio, devicePixelRatio);
    this.#ctx.stroke(path.path2d);

  }
}

const ELEMENTS = [{
  name: 'rr-diagram',
  constructor: RailroadDiagram
}, {
  name: 'rr-sequence',
  constructor: RailroadSequence
}, {
  name: 'rr-choice',
  constructor: RailroadChoice
}, {
  name: 'rr-start',
  constructor: RailroadStart,
}, {
  name: 'rr-end',
  constructor: RailroadEnd,
}, {
  name: 'rr-terminal',
  constructor: RailroadTerminal,
}, {
  name: 'rr-nonterminal',
  constructor: RailroadNonterminal
}];

for (const { name, constructor } of ELEMENTS) {
  customElements.define(name, constructor);  
}
