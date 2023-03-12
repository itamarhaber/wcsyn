function fromPx(s) { return Number(s.slice(0,-2)) }
function caller() { return (new Error()).stack.split("\n")[3].trim().split(" ")[1] }
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
  #arcRadius;
  #start;
  #cx;
  #cy;
  #ltr;
  #ttb;
  constructor(canvas, arcRadius) {
    this.#canvas = canvas;
    this.#arcRadius = arcRadius;
    this.#start = true;
    this.moveTo(0, 0);
  }

  moveTo(x, y) {
    this.#x = x;
    this.#y = y;
    this.#ltr = true;
    this.#ttb = true;
    this.#start = true;
    this.#path2d.moveTo(x, y);
  }

  // Never use this.
  // lineTo(x, y) {
  //   this.#x = x;
  //   this.#y = y;
  //   this.#path2d.lineTo(x, y);
  // }
/*

-----

---
    |
___

1.5, 0  ___  0, 1/2
       /   \
       |   |
1, 1.5 \___/ 1/2, 1
*/
  // if ltr && ttb
  // start && end
  // ------------
  // start && !end
  // --------
  // !start && !end
  //   \_______
  // !start && end
  // \____________

  verticalTo(y, end = false) {
    if (this.#y === y) return;
    this.#ttb = this.#y < y;
    const AR = this.#arcRadius;
    const XOR = ((this.#ltr ? !this.#ttb : this.#ttb) ? AR : -AR);
    // console.log(caller(), 'V', this.#start, 'end', end, 'y', y, 'this.#y', this.#y, 'ltr', this.#ltr, 'ttb', this.#ttb,'XOR', XOR, 'cx', this.#cx, 'cy', this.#cy)
    if (this.#start) {
      // No need to do an arc from prev, stop before actual x
    } else {
      // connect previous cx
      this.path2d.moveTo(this.#cx, this.#y);
      this.#path2d.arcTo(this.#x, this.#y, this.#x, y, AR);
      this.#cy = this.#y + (this.#ttb ? AR : -AR);
      // this.#path2d.lineTo(this.#x, this.#cy);
    }
    if (end) {
      // Connect to end without an arc
      this.#path2d.lineTo(this.#x, y);
      this.#cx = this.#x;
      this.#cy = y;
    } else {
      // keep space for arc
      this.#cy = y - (this.#ttb ? AR : -AR);
      this.#path2d.lineTo(this.#x, this.#cy);
    }
    this.#start = end;
    this.#y = y;
  }

  horizontalTo(x, end = false) {
    if (this.#x === x) return;
    this.#ltr = this.#x < x;
    const AR = this.#arcRadius;
    const XOR = ((this.#ltr ? !this.#ttb : this.#ttb) ? AR : -AR);
    // console.log(caller(), 'H', 'start', this.#start, 'end', end, 'x', x, 'this.#x', this.#x, 'ltr', this.#ltr, 'ttb', this.#ttb,'XOR', XOR, 'cx', this.#cx, 'cy', this.#cy)
    if (this.#start) {
      // No need to do an arc from prev, stop before actual x
    } else {
      // connect previous cx
      this.path2d.moveTo(this.#x, this.#cy);
      this.#path2d.arcTo(this.#x, this.#y, x, this.#y, AR);
      this.#cx = this.#x + (this.#ltr ? AR : -AR);
      // this.#path2d.lineTo(this.#cx, this.#y);
    }
    if (end) {
      // Connect to end without an arc
      this.#path2d.lineTo(x, this.#y);
      this.#cx = x;
      this.#cy = this.#y;
    } else {
      // keep space for arc
      this.#cx = x - (this.#ltr ? AR : -AR);
      this.#path2d.lineTo(this.#cx, this.#y);
    }
    this.#start = end;
    this.#x = x;
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
    path.horizontalTo(x + gap.quarterInline);
    path.verticalTo(this.offsetTop - gap.midBlock);
    path.horizontalTo(x + this.offsetWidth + gap.midInline + gap.quarterInline);
    path.verticalTo(y);
    path.horizontalTo(this.offsetLeft + this.offsetWidth + gap.midInline, true);
    path.x = x;
  }

  #drawRepeatable(path, gap) {
    if (!this.hasAttribute('repeatable')) return;

    const { x, y } = path;
    path.moveTo(x + gap.midInline + gap.quarterInline, y);
    path.horizontalTo(x + gap.quarterInline);
    path.verticalTo(this.offsetTop + this.offsetHeight + gap.midBlock);
    path.horizontalTo(this.offsetLeft + this.offsetWidth + gap.midInline - gap.quarterInline);
    path.verticalTo(y);
    path.horizontalTo(this.offsetLeft + this.offsetWidth, true);
    path.x = x;
  }

  draw(path, gap, end) {
    const { x, width } = this.getRect();
    this.#drawOptional(path, gap);
    this.#drawRepeatable(path, gap);
    path.horizontalTo(x + width + gap.midInline, end);
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
      midInline: Math.round(inline / 2),
      quarterInline: Math.round(inline / 4)
    };
  }
}

class RailroadSequence extends RailroadContainer {
  draw(path, gap, start = 0) {
    let lineHeight = 0;
    for (let i = start; i < this.children.length; i++) {
      const child = this.children[i],
        { midHeight } = child.getRect();

      // TODO: the diagram's leftmost is cut by 0.5 * lineWidth
      if (path.x > child.offsetLeft) {
        let prev = this.children[i-1];
        path.horizontalTo(prev.offsetLeft + prev.offsetWidth + gap.midInline);
        path.verticalTo(prev.offsetTop + lineHeight + gap.midBlock);
        path.horizontalTo(child.offsetLeft - gap.inline);
        path.verticalTo(midHeight);
        path.horizontalTo(child.offsetLeft - gap.midInline, true);
        lineHeight = child.offsetHeight;
      } else if (child.offsetHeight > lineHeight) {
        lineHeight = child.offsetHeight;
      }

      child.draw(path, gap, true);
    }
  }
}

class RailroadChoice extends RailroadContainer {
  draw(path, gap) {
    const { x, y } = path;
    // TODO: first child is problematic :/
    // TODO: see migrate
    // TODO: if optional, sequence line crosses
    super.draw(path, gap)
    const me = this.getGap();
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const first = i === 0;
      path.horizontalTo(this.offsetLeft + me.quarterInline);
      path.verticalTo(child.getRect().midHeight);
      path.horizontalTo(this.offsetLeft + me.quarterInline);
      child.draw(path, me, true);
      path.horizontalTo(this.offsetLeft + this.offsetWidth - me.midInline + gap.quarterInline, first);
      path.verticalTo(y);
      path.horizontalTo(this.offsetLeft + this.offsetWidth + gap.midInline, true);
      path.x = x;
    }
    path.x += this.offsetWidth + gap.midInline;
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
    path.moveTo(this.getGap().midInline, this.children[1].getRect().midHeight); // TODO: Start
    super.draw(path, this.getGap(), 1);
    path.horizontalTo(this.offsetLeft + this.offsetWidth - this.getGap().midInline, true);// TODO: End

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
