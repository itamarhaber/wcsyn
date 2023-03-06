import rr, * as rrClass from "./railroad.js";
function fromPx(s) { return Number(s.slice(0,-2)) }

function determineGaps(outer, inner) {
	var diff = outer - inner;
	switch(rrClass.Options.INTERNAL_ALIGNMENT) {
		case 'left': return [0, diff];
		case 'right': return [diff, 0];
		default: return [diff/2, diff/2];
	}
}

class RailroadRect extends rrClass.FakeSVG {
	constructor(width, height, up=0, down=0, cls='') {
		super('g', {'class': ['rect', cls].join(' ')});
		this.width = width;
		this._height = height;
    this.height = 0;
    this.up = up;
    this.down = down;
		this.needsSpace = true;
	}
	format(x, y, width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new rrClass.Path(x,y).h(gaps[0]).addTo(this);
		new rrClass.Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		new rrClass.FakeSVG('rect', {x:x, y:y-11, width:this.width, height:this.up+this._height+this.down}).addTo(this);
		return this;
	}
}

class RailroadElement extends HTMLElement {
  prePseudoElements;
  postPseudoElements;
  items;
  delem;
  constructor () {
    super();
    this.items = [];
    this.prePseudoElements = this.postPseudoElements = 0;
  }

  toDiagram () {
    return new rrClass.FakeSVG();
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
      x: Math.round(x),
      left: Math.round(left),
      y: Math.round(y),
      top: Math.round(top),
      width: Math.round(width),
      right: Math.round(right),
      height: Math.round(height),
      bottom: Math.round(bottom),
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

class RailroadStart extends RailroadElement {
  constructor() {
    super();
    const el = new rrClass.Start();
    this.style.width = `${el.width}px`;
    this.style.height = `${el.up + el.height + el.down}px`;
  }

  toDiagram () {
    return new rrClass.Start();
  }
}

class RailroadEnd extends RailroadElement {
  constructor() {
    super();
  }

  toDiagram () {
    return new rrClass.End();
  }
}

class RailroadSkip extends RailroadElement {
  constructor() {
    super();
  }

  toDiagram () {
    return new rrClass.Skip();
  }
}

class RailroadTerminal extends RailroadElement {
  constructor() {
    super();
  }

  toDiagram () {
    const s = this.getShape();
    console.log(s)
    return new RailroadRect(s.width, s.height);
  }
}

class RailroadNonTerminal extends RailroadElement {
  constructor() {
    super();
  }

  toDiagram () {
    const s = this.getShape();
    return new RailroadRect(s.width, s.height);
  }
}

class RailroadComment extends RailroadElement {
  constructor() {
    super();
  }

  toDiagram () {
    return new rrClass.Comment(this.textContent);
  }
}

// class RailroadGroup extends RailroadElement {
//   #label
//   constructor() {
//     super();
//     this.mapping = rrClass.Group;
//     this.#label = document.createElement('span');
//     this.#label.textContent = this.getAttribute('text') || '';
//     this.prepend(this.#label);
//     this.prePseudoElements++;
//   }

//   toDiagram () {
//     super.toDiagram();
//     return new rrClass.Group(...this.items,);
//   }
// }

class RailroadMultiContainer extends RailroadElement {
  constructor () {
    super();
    this.mapping = rrClass.DiagramMultiContainer;
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
  
  toDiagram() {
    const first = this.prePseudoElements;
    const last = this.children.length - this.postPseudoElements - 1;

    for (let i = first; i <= last; i++) {
      const child = this.children[i];
      if (!(child instanceof RailroadElement)) {
        throw new TypeError(`Invalid element in <rr-diagram> ${child.tagName}`);
      };
      this.items.push(child.toDiagram());
    }
  }
}

class RailroadSequence extends RailroadMultiContainer {
  constructor() {
    super();
  }

  toDiagram () {
    super.toDiagram();
    return new rrClass.Sequence(...this.items);
  }
}

class RailroadStack extends RailroadMultiContainer {
  constructor() {
    super();
  }

  toDiagram () {
    super.toDiagram();
    return new rrClass.Stack(...this.items);
  }
}

class RailroadDiagram extends RailroadMultiContainer {
  #rr;

  constructor () {
    super();
    this.#rr = document.createElement('svg');
    this.prepend(this.#rr);
    this.prePseudoElements++;
  }

  connectedCallback() {
    customElements.whenDefined('rr-element')
      .then(() => setTimeout(() => this.draw()));
    window.addEventListener('resize',() => this.draw());
  }

  disconnectedCallback() {
    console.debug('RailroadDiagram disconnectedCallback');
  }

  draw() {
    const first = this.prePseudoElements;
    const last = this.children.length - this.postPseudoElements - 1;

    const d = this.toDiagram().format(1,1,1,1);
    this.#rr = d.toSVG();
    this.children[0].remove();
    this.prepend(this.#rr);
  }

  toDiagram() {
    super.toDiagram();
    return new rrClass.Diagram(...this.items);
  }
}

customElements.define('rr-diagram', RailroadDiagram);
customElements.define('rr-sequence', RailroadSequence);
// customElements.define('rr-group', RailroadGroup);
customElements.define('rr-stack', RailroadStack);
customElements.define('rr-multi-container', RailroadMultiContainer);
customElements.define('rr-comment', RailroadComment);
customElements.define('rr-nonterminal', RailroadNonTerminal);
customElements.define('rr-terminal', RailroadTerminal);
customElements.define('rr-skip', RailroadSkip);
customElements.define('rr-start', RailroadStart);
customElements.define('rr-end', RailroadEnd);
customElements.define('rr-element', RailroadElement);
