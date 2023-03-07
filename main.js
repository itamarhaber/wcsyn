function fromPx(s) { return Number(s.slice(0,-2)) }

const AR = 8;

class Canvas {
  constructor(canvasElement) {
    this.el = canvasElement;
    const ctx = this.el.getContext('2d'); // why is this needed?
  }
/*
O ---- X  X ---- O
|                |
X                X

X                X
|                |
O ---- X  X ---- O

X ---- X

X
|
X

 */
  connectPath(points) {
    if (!(points instanceof Array)) {
      throw new TypeError (`Expecting an array`);
    }
    const ctx = this.el.getContext('2d');
    const path = new Path2D;
    let px, py;
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      if (i !== 0) {
        const above = y < py, below = y > py, behind = x < px, after = x > px;
        path.moveTo(x,y);
        if (after && above) {
          path.lineTo(px+AR,y);
          path.arcTo(px,y,px,y+AR,AR);
          path.lineTo(px,py);
        } else if (after && below) {
          path.lineTo(x,y-AR);
          path.arcTo(x,py,px,py,AR);
          path.lineTo(px,py);
        } else if (behind && above) {
          path.lineTo(x,y+AR);
          path.arcTo(x,py,px,py,AR);
          path.lineTo(px,py);
        } else if (behind && below) {
          path.lineTo(px-AR,y);
          path.arcTo(px,y,px,py,AR);
          path.lineTo(px,py);
        } else {
          path.lineTo(px,py);
        }
      }
      if (i === points.length - 1) {

      }
      px = x, py = y;
    }
    ctx.save();
    ctx.stroke(path);
    ctx.restore();
  }

  roundRect(s) {
    // Because rectRound isn't supported in Mozilla FF :/
    // const points = [
    //   [s.left+s.hw,s.top],
    //   [s.right,s.top+s.hh],
    //   [s.left+s.hw,s.bottom],
    //   [s.left,s.top+s.hh],
    //   [s.left+s.hw,s.top],
    // ];
    // this.connectPath(points);
    const ctx = this.el.getContext('2d', { });
    const path = new Path2D;
    path.moveTo(s.left+AR,s.top);
    path.lineTo(s.right-AR,s.top);
    path.arcTo(s.right,s.top,s.right,s.top+AR,AR);
    path.lineTo(s.right,s.bottom-AR);
    path.arcTo(s.right,s.bottom,s.right-AR,s.bottom,AR);
    path.lineTo(s.left+AR,s.bottom);
    path.arcTo(s.left,s.bottom,s.left,s.bottom-AR,AR);
    path.lineTo(s.left,s.top+AR);
    path.arcTo(s.left,s.top,s.left+AR,s.top,AR);
    ctx.save();
    ctx.fill(path);
    ctx.stroke(path);
    ctx.restore();
  }
}

class RailroadElement extends HTMLElement {
  constructor () {
    super();
    this.prePseudoEls = 0;
    this.postPseudoEls = 0;
    this.rect = this.getRect();
  }

  connectedCallback() {
    // this.parentElement.draw();
  }

  disconnectedCallback() {
    this.dispatchEvent(new Event('disconnect'));
  }

  getRect() {
    const {
      x, left, y, top, width, right, height, bottom
    } = this.getBoundingClientRect();
    const hh = Math.round(height/2);
    const hw = Math.round(width/2);
    const hcg = Math.round(fromPx(this.style.columnGap || window.getComputedStyle(this).columnGap)/2);
    const hrg = Math.round(fromPx(this.style.rowGap || window.getComputedStyle(this).rowGap)/2);
    const hml = Math.round(fromPx(this.style.marginLeft || window.getComputedStyle(this).marginLeft)/2);
    const hmr = Math.round(fromPx(this.style.marginRight || window.getComputedStyle(this).marginRight)/2);
    const hpl = Math.round(fromPx(this.style.paddingLeft || window.getComputedStyle(this).paddingLeft)/2);
    const hpr = Math.round(fromPx(this.style.paddingRight || window.getComputedStyle(this).paddingRight)/2);

    return {
      x: Math.round(x),
      left: Math.round(left),
      y: Math.round(y),
      top: Math.round(top),
      width: Math.round(width),
      right: Math.round(right),
      height: Math.round(height),
      bottom: Math.round(bottom),
      y1: Math.round(y) + hh,
      y2: Math.round(y) + hh,
      hw, hh, hcg, hrg, hml, hmr, hpl, hpr,
    }
  }

  draw(_) {
    this.rect = this.getRect();
    return this.rect;
  }

  drawHandles(canvas,left=true, right=true) {
    const ctx = canvas.el.getContext('2d');
    ctx.save();
    if (left) {
      const l = this instanceof RailroadContainer ? this.rect.hcg : this.rect.hpl;
      ctx.moveTo(this.rect.left, this.rect.y1);
      ctx.lineTo(this.rect.left-l, this.rect.y1);      
    }
    if (right) {
      const r = this instanceof RailroadContainer ? this.rect.hcg : this.rect.hpr;
      ctx.moveTo(this.rect.right, this.rect.y2);
      ctx.lineTo(this.rect.right+r, this.rect.y2);
    }
    ctx.stroke();
    ctx.restore();
  }
}

class RailroadTerminus extends RailroadElement {
  constructor() {
    super();
  }
  draw(canvas) {
    const rect = super.draw();
    const ctx = canvas.el.getContext('2d');
    const path = new Path2D;
    const mx = rect.x + Math.round(rect.width / 2);
    const my = rect.y + Math.round(rect.height / 2);
    path.moveTo(rect.left,rect.top);
    path.lineTo(rect.left,rect.bottom)
    path.moveTo(mx,rect.top);
    path.lineTo(mx,rect.bottom)
    path.moveTo(rect.left,my);
    path.lineTo(rect.right,my);
    ctx.save();
    ctx.stroke(path);
    ctx.restore();
    return rect;
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
  draw(canvas) {
    const rect = super.draw();
    const ctx = canvas.el.getContext('2d');
    ctx.save();
    ctx.rect(rect.left,rect.top,rect.width,rect.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return rect;
  }
}

class RailroadNonTerminal extends RailroadElement {
  constructor() {
    super();
  }
  draw(canvas) {
    const rect = super.draw();
    canvas.roundRect(rect);
    return rect;
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
  
  draw(canvas) {
    console.debug('drawing container');
    const first = this.prePseudoEls;
    const last = this.children.length - this.postPseudoEls - 1;
    const me = super.draw();
    const ctx = canvas.el.getContext('2d');
    ctx.save();
    for (let i = first; i <= last; i++) {
      const child = this.children[i];
      if (!(child instanceof RailroadElement)) {
        throw new TypeError(`Invalid element in <rr-diagram> ${child.tagName}`);
      }
      const rect = child.draw(canvas);
      if (i === first) {
        me.y1 = rect.y1;
      }
      if (i === last) {
        me.y2 = rect.y2;
      }
      if (!(child instanceof RailroadContainer)) {
        child.drawHandles(canvas);
      }
    }
    ctx.stroke();
    ctx.restore();
    return me;
  }
}

class RailroadSequence extends RailroadContainer {
  constructor() {
    super();
  }
  draw(canvas) {
    const first = this.prePseudoEls;
    const last = this.children.length - this.postPseudoEls - 1;
    const me = super.draw(canvas);
    const ctx = canvas.el.getContext('2d');
    ctx.save()
    const path = new Path2D;
    let py = 0, px = 0, pb = 0, pc = false;
    for (let i = first; i <= last; i++) {
      const child = this.children[i];
      if (i === first) {
        path.moveTo(me.left,child.rect.y1);
        path.lineTo(child.rect.x,child.rect.y1);
      }
      if (i === last) {
        path.moveTo(child.rect.right,child.rect.y2);
        path.lineTo(me.right,child.rect.y2);
      }
      if (px >= child.rect.x && py < child.rect.y1) {
        // Draw line wrap path
        let x = me.right-me.hpr, y = pb+me.hrg;
        path.moveTo(px,py);
        path.arcTo(x,py,x,pb,AR); // Right, down
        path.lineTo(x,y-AR);
        path.arcTo(x,y,px+me.hpl,y,AR);
        x = me.left+me.hpl*2;
        path.lineTo(x,y);
        x -= me.hpl;
        path.arcTo(x,y,x,child.rect.y1,AR);
        y = child.rect.y1;
        path.lineTo(x,y-AR);
        path.arcTo(x,y,child.rect.x,y,AR);
        path.lineTo(child.rect.x,y);
        ctx.save();
        ctx.stroke(path);
        ctx.restore();
        px = 0;
        py = child.rect.y2;
        pb = child.rect.bottom;
      } else if (i !== first && !pc) {
        // Mind the gap
        // path.moveTo(px,py);
        // path.lineTo(child.rect.x,py);
      }
      px = child.rect.right;
      py = child.rect.y2;
      pb = Math.max(pb, child.rect.bottom);
      pc = child instanceof RailroadContainer;
    }
    this.rect.y2 = me.y2 = me.y1;
    ctx.stroke(path);
    ctx.restore();
    return me;
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


class RailroadStack extends RailroadSequence {
  constructor() {
    super();
  }

  draw(canvas) {
    const me = super.draw(canvas);
    return me;
  }
}

class RailroadDiagram extends RailroadSequence {
  #canvas;
  #start;
  #end;

  constructor () {
    super();
    this.#start = document.createElement('rr-terminus');
    // this.prepend(this.#start);
    // this.prePseudoEls++;
    // this.#end = document.createElement('rr-terminus');
    // this.append(this.#end);
    // this.postPseudoEls++;
    this.#canvas = new Canvas(document.createElement('canvas'));
    this.prepend(this.#canvas.el);
    this.prePseudoEls++;
  }

  connectedCallback() {
    super.connectedCallback(); // LEIBALE HELP!P!
    customElements.whenDefined('rr-element')
      .then(() => setTimeout(() => this.draw()));
    window.addEventListener('resize',() => this.draw());
  }

  disconnectedCallback() {
    console.debug('RailroadDiagram disconnectedCallback');
  }

  draw() {
    console.debug('drawing diagram');
    const rect = this.getRect();

    // Set the "actual" size of the canvas
    this.#canvas.el.width = rect.width;
    this.#canvas.el.height = rect.height;

    const ctx = this.#canvas.el.getContext('2d', { alpha: false, });
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'hsl(120,100%,90%)';
    ctx.translate(-rect.x, -rect.y);
    ctx.clearRect(0,0,rect.width,rect.height);  // CLS
    ctx.save();
    super.draw(this.#canvas);
    ctx.restore();
    // this.#start.draw(this.#canvas);
    // this.#end.draw(this.#canvas);
  }
}

customElements.define('rr-diagram', RailroadDiagram);
customElements.define('rr-terminus', RailroadTerminus);
customElements.define('rr-sequence', RailroadSequence);
customElements.define('rr-group', RailroadGroup);
customElements.define('rr-stack', RailroadStack);
customElements.define('rr-container', RailroadContainer);
customElements.define('rr-comment', RailroadComment);
customElements.define('rr-nonterminal', RailroadNonTerminal);
customElements.define('rr-terminal', RailroadTerminal);
customElements.define('rr-skip', RailroadSkip);
customElements.define('rr-element', RailroadElement);
