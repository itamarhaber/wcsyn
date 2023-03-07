function fromPx(s) { return Number(s.slice(0,-2)) }

const AR = 8;

class Canvas {
  constructor(canvasElement) {
    this.el = canvasElement;
    const ctx = this.el.getContext('2d'); // why is this needed?
  }
  roundRect(s) {
    // Because rectRound isn't supported in FF :/
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
    }
  }

  draw(_) {
    this.rect = this.getRect();
    return this.rect;
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

  #isNewLine(x1,y1,x2,y2) {
    return x2-x1 <= 0 && y2-y1 > 0;
  }
  
  draw(canvas) {
    console.debug('drawing container');
    const first = this.prePseudoEls;
    const last = this.children.length - this.postPseudoEls - 1;
    const cgap = Math.round(fromPx(this.style.columnGap || window.getComputedStyle(this).columnGap)/2);
    const ctx = canvas.el.getContext('2d');
    const me = super.draw();
    for (let i = first; i <= last; i++) {
      const child = this.children[i];
      if (!(child instanceof RailroadElement)) {
        throw new TypeError(`Invalid element in <railroad-diagram> ${child.tagName}`);
      }
      const rect = child.draw(canvas);
      if (i === first) {
        me.y1 = rect.y1;
      }
      if (i === last) {
        me.y2 = rect.y2;
      }
      
      // Draw connectors
      const path = new Path2D;
      path.moveTo(rect.left, rect.y1);
      path.lineTo(rect.left-cgap, rect.y1);  
      path.moveTo(rect.right, rect.y2);
      path.lineTo(rect.right+cgap, rect.y2);
      ctx.save()
      ctx.stroke(path);
      ctx.restore();
    }
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
    const cgap = Math.round(fromPx(this.style.columnGap || window.getComputedStyle(this).columnGap)/2);
    const rgap = Math.round(fromPx(this.style.rowGap || window.getComputedStyle(this).rowGap)/2);
    const ctx = canvas.el.getContext('2d');
    const me = super.draw(canvas);
    if (me.y1 !== me.y2) {
      // Line wraps
      let py = 0, px = 0, pb = 0;
      for (let i = first; i <= last; i++) {
        const child = this.children[i];
        if (i === first) {
          py = child.rect.y2;
          px = child.rect.right + cgap;
          pb = child.rect.bottom + rgap;
        }
        if (px >= child.rect.x && py < child.rect.y1) {
          // Draw line wrap path
          const path = new Path2D;
          path.moveTo(px+cgap-1,py);
          path.arcTo(px+cgap*2,py,px+cgap*2,pb,AR);
          path.lineTo(px+cgap*2,pb-AR);
          path.arcTo(px+cgap*2,pb,child.rect.x+ctx.lineWidth,child.rect.y1,AR);
          path.lineTo(child.rect.x-cgap,pb);
          path.arcTo(child.rect.x-2*cgap+ctx.lineWidth,pb,child.rect.x-2*cgap+ctx.lineWidth,child.rect.y1,AR);
          path.lineTo(child.rect.x-2*cgap+ctx.lineWidth,child.rect.y1-AR);
          path.arcTo(child.rect.x-2*cgap+ctx.lineWidth,child.rect.y1,child.rect.x,child.rect.y1,AR);
          path.lineTo(child.rect.x-cgap+ctx.lineWidth,child.rect.y1);
          ctx.save();
          ctx.stroke(path);
          ctx.restore();
          px = 0;
          py = child.rect.y2;
          pb = child.rect.bottom+rgap;
        }
        px = child.rect.right;
        py = child.rect.y2;
      }  
    }
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


class RailroadStack extends RailroadContainer {
  constructor() {
    super();
  }
}

class RailroadDiagram extends RailroadSequence {
  #canvas;
  #start;
  #end;

  constructor () {
    super();
    this.#start = document.createElement('railroad-terminus');
    // this.prepend(this.#start);
    // this.prePseudoEls++;
    // this.#end = document.createElement('railroad-terminus');
    // this.append(this.#end);
    // this.postPseudoEls++;
    this.#canvas = new Canvas(document.createElement('canvas'));
    this.prepend(this.#canvas.el);
    this.prePseudoEls++;
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

customElements.define('railroad-diagram', RailroadDiagram);
customElements.define('railroad-terminus', RailroadTerminus);
customElements.define('railroad-sequence', RailroadSequence);
customElements.define('railroad-group', RailroadGroup);
customElements.define('railroad-stack', RailroadStack);
customElements.define('railroad-container', RailroadContainer);
customElements.define('railroad-comment', RailroadComment);
customElements.define('railroad-nonterminal', RailroadNonTerminal);
customElements.define('railroad-terminal', RailroadTerminal);
customElements.define('railroad-skip', RailroadSkip);
customElements.define('railroad-element', RailroadElement);
