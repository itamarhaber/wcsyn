const DEBUG = false;
function debug(...args) {
  if (DEBUG) console.log(...args);
}
function caller() { return (new Error()).stack.split("\n")[3].trim().split(" ")[1] }

const fromPx = s => Number(s.slice(0, -2));

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
  #ctx;
  #width;

  get width() {
    return this.#width;
  }

  #midWidth;
  
  get midWidth() {
    return this.#midWidth;
  }

  #arcRadius;
  #start;
  #cx;
  #cy;
  #ltr;
  #ttb;
  constructor(canvas, arcRadius) {
    this.#canvas = canvas;
    this.#arcRadius = arcRadius;
    this.#ctx = this.#canvas.getContext('2d');
    this.#width = this.#ctx.lineWidth;
    this.#midWidth = Math.round(this.#width / 2);
    this.#start = true;
    this.moveTo(0, 0);
  }

  moveTo(x, y) {
    this.#x = x;
    this.#y = y;
    this.#ltr = true;
    this.#ttb = true;
    this.#start = true;
    this.#path2d.moveTo(this.#x, this.#y);
  }

  verticalTo(y, end = false) {
    if (this.#y === y) return;

    this.#ttb = this.#y < y;
    const AR = this.#arcRadius;
    const XOR = ((this.#ltr ? !this.#ttb : this.#ttb) ? AR : -AR);
    debug(caller(), 'V', this.#start, 'end', end, 'y', y, 'this.#y', this.#y, 'ltr', this.#ltr, 'ttb', this.#ttb,'XOR', XOR, 'cx', this.#cx, 'cy', this.#cy)

    if (!this.#start) {
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
    debug(caller(), 'H', 'start', this.#start, 'end', end, 'x', x, 'this.#x', this.#x, 'ltr', this.#ltr, 'ttb', this.#ttb,'XOR', XOR, 'cx', this.#cx, 'cy', this.#cy)

    if (!this.#start) {
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

  marker() {
    this.#path2d.rect(this.#x, this.#y, 4, 4);
    // this.#path2d.arc(this.#x, this.#y, 2, 0, 2 * Math.PI);
  }
}

class RailroadElement extends HTMLElement {
  connectedCallback() {
    // this.parentElement.draw();
  }

  disconnectedCallback() {
    // this.dispatchEvent(new Event('disconnect'));
  }

  isOptional() {
    return this.hasAttribute('optional');
  }

  isRepeatable() {
    return this.hasAttribute('repeatable');
  }

  #drawOptional(path, gap, rightMidHeight) {
    if (!this.isOptional()) return;

    const { x, y } = path;
    path.horizontalTo(x + gap.quarterInline);
    path.verticalTo(this.offsetTop - gap.quarterBlock); // + path.width
    path.horizontalTo(x + this.offsetWidth + gap.midInline + gap.quarterInline); // - path.midWidth
    path.verticalTo(rightMidHeight);
    path.horizontalTo(this.offsetLeft + this.offsetWidth + gap.midInline, true);
    path.moveTo(x, y);
  }

  #drawRepeatable(path, gap, start) {
    if (!this.isRepeatable()) return;

    // const { x, y } = path,
    //   rect = this.getRect();

    // console.log(this,rect, this.offsetLeft, this.offsetTop, this.offsetWidth, this.offsetHeight)
    // path.moveTo(rect.x + rect.width - gap.midInline, rightMidHeight);
    // path.horizontalTo(path.x + gap.quarterInline);
    // debug(rect.y + rect.height);
    // path.verticalTo(rect.y + rect.height + gap.midBlock); //  - path.width - 2
    // path.horizontalTo(x + gap.midInline - gap.quarterInline);
    // path.verticalTo(y);
    // path.horizontalTo(this.offsetLeft + this.offsetWidth, true);
    // path.x = x; 
    const { x, y } = path,
      rect = this.getRect(start);
    path.x += rect.width - gap.midInline;
    path.horizontalTo(path.x + gap.quarterInline);
    path.verticalTo(rect.y + rect.height - gap.quarterBlock); // + path.width
    path.horizontalTo(x + gap.quarterInline); // - path.midWidth
    path.verticalTo(y);
    path.horizontalTo(x + gap.midBlock, true);
    path.moveTo(x, y);
  }

  draw(path, gap, start = 0, end = false) {

    const { x, width, rightMidHeight, rightX } = this.getRect(start);
    path.horizontalTo(x, true);
    if (this.isOptional() || this.isRepeatable()) {
      this.#drawOptional(path, gap, rightMidHeight);
      this.#drawRepeatable(path, gap, start);
      path.horizontalTo(this.offsetLeft, true);
      path.moveTo(x + width - gap.midInline, rightMidHeight);
      path.horizontalTo(x + width, true);
      
    }
    path.moveTo(rightX - 1, rightMidHeight);
    path.horizontalTo(x + width + gap.midInline, end);
  }

  getRect() {
    const style = getComputedStyle(this),
      ml = fromPx(style['margin-left']),
      mt = fromPx(style['margin-top']),
      mr = fromPx(style['margin-right']),
      mb = fromPx(style['margin-bottom']);
    return {
      x: this.offsetLeft - ml,
      y: this.offsetTop - mt, 
      width: this.offsetWidth + ml + mr,
      height: this.offsetHeight + mt + mb,
      leftMidHeight: this.offsetTop + Math.round(this.offsetHeight / 2),
      rightMidHeight: this.offsetTop + Math.round(this.offsetHeight / 2),
      rightX: this.offsetLeft + this.offsetWidth + mr
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
    debug('RailroadElement disconnectedCallback');
  }

  getRect(start = 0) {
    const style = getComputedStyle(this),
      ml = fromPx(style['margin-left']),
      mt = fromPx(style['margin-top']),
      mr = fromPx(style['margin-right']),
      mb = fromPx(style['margin-bottom']),
      frect = this.children[start].getRect(),
      lrect = this.children[this.children.length-1].getRect();
    return {
      x: this.offsetLeft - ml,
      y: this.offsetHeight - mt, 
      width: this.offsetWidth + ml + mr,
      height: this.offsetHeight + mt + mb,
      leftMidHeight: frect.leftMidHeight,
      rightMidHeight: lrect.rightMidHeight,
      rightX: lrect.x + lrect.width
    };
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
      quarterBlock: Math.round(block / 4),
      quarterInline: Math.round(inline / 4)
    };
  }
}

class RailroadSequence extends RailroadContainer {
  draw(path, gap, start = 0, end = false) {
    for (let i = start; i < this.children.length; i++) {
      const child = this.children[i],
        {x, y, leftMidHeight} = child.getRect();
      if (path.x > x) {
        let prev = this.children[i-1].getRect();
        path.horizontalTo(prev.rightX + gap.inline + gap.midInline);
        path.verticalTo(y - gap.block);
        path.horizontalTo(this.offsetLeft + gap.quarterInline);
        path.verticalTo(leftMidHeight);
        path.horizontalTo(child.offsetLeft, true);
      }
      child.draw(path, gap, 0, true);
    }

    const rect = this.getRect(start);
    path.moveTo(rect.x , rect.y);
    super.draw(path, gap, start, end);
  }
}

class RailroadChoice extends RailroadContainer {
  draw(path, gap, start = 0, end = false) {
    const { x, y } = path;
    // TODO: first child is problematic :/
    // TODO: see migrate
    // TODO: if optional, sequence line crosses
    const me = this.getGap();
    for (let i = start; i < this.children.length; i++) {
      const child = this.children[i];
      const first = i === 0;
      path.horizontalTo(this.offsetLeft + me.quarterInline);
      path.verticalTo(child.getRect().midHeight);
      path.horizontalTo(this.offsetLeft + me.quarterInline);
      child.draw(path, me, 0, true);
      path.horizontalTo(this.offsetLeft + this.offsetWidth - me.midInline + gap.quarterInline);
      path.verticalTo(y);
      path.horizontalTo(this.offsetLeft + this.offsetWidth + gap.midInline, true);
      path.x = x;
    }
    super.draw(path, gap, 0, end)
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

    const style = getComputedStyle(this),
      arcRadius = fromPx(style.getPropertyValue('--arc-radius')) || 8,
      lineWidth = fromPx(style.getPropertyValue('--line-width')) || 4,
      lineColor = style.getPropertyValue('--line-color'),
      backgroundColor = style.getPropertyValue('--background-color'),
      path = new Path(this.#canvas, arcRadius),
      gap = this.getGap(),
      child = this.children[1].getRect();

    path.moveTo(child.x, child.leftMidHeight); // TODO: Start
    super.draw(path, gap, 1);
    // path.horizontalTo(this.offsetLeft + this.offsetWidth - this.getGap().midInline, true);// TODO: End

    this.#ctx.lineJoin = 'round';
    this.#ctx.lineWidth = lineWidth;
    this.#ctx.lineStyle = lineColor;
    this.#ctx.fillStyle = backgroundColor;
    this.#ctx.scale(devicePixelRatio, devicePixelRatio);
    this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
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
