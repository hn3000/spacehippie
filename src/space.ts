module space {

  interface IPaintable {
    paint(ctx:CanvasRenderingContext2D);
    done(h:number,w:number):boolean;
  }

  class Star implements IPaintable {
    private _x:number;
    private _y:number;
    private _sx:number;
    private _sy:number;
    private _start:number;
    constructor(x,y,sx,sy) {
      this._x = x;
      this._y = y;
      this._sx = sx;
      this._sy = sy;
      this._start = Date.now();
    }

    paint(ctx:CanvasRenderingContext2D) {
      let dt = (Date.now() - this._start) / 10;
      let sx = this._sx;
      let sy = this._sy;
      let x = this._x + sx * dt;
      let y = this._y + sy * dt;

      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+Math.min(-1,sx),y+Math.min(-1,sy));
      ctx.stroke();
      ctx.restore();
    }

    done(h:number,w:number):boolean {
      let dt = (Date.now() - this._start) / 10;
      let x = this._x + this._sx * dt;
      let y = this._y + this._sy * dt;

      return x < 0 || x > w || y < 0 || y > h;
    }
  }

  let r = Math.random.bind(Math);

  export class Game {
    private _canvas: HTMLCanvasElement;
    private _raf:(repaint:()=>void)=>void;
    private _repaintRequested:boolean;
    private _h:number;
    private _w:number;

    private _starCount:number;

    private _paintables:IPaintable[];

    constructor(id:string) {
      this._canvas = <HTMLCanvasElement>document.querySelector(id);
      this._repaintRequested = false;
      window.addEventListener('resize', this.resized.bind(this), true);
      this._paintables = [];
      this.resized();
    }

    createStar(h:number,w:number,atEdge:boolean) {
      let x = atEdge ? w : r()*w;
      return new Star(x, r()*h, (0.1+r())*-2, 0);
    }

    updateSize() {
      let b = document.body;
      let h = b.offsetHeight;
      let w = b.offsetWidth;
      let canvas = this._canvas;
      this._h = canvas.height = h;
      this._w = canvas.width = w;
      console.log("resized: ",w,h);
      //canvas.style.height = h+'px';
      //canvas.style.width = w+'px';

      this._starCount = Math.ceil(w*h / 3000);

      this._paintables = [];
      for (let i = 0; i < this._starCount; ++i) {
        this._paintables.push(this.createStar(h,w,false));
      }
    }

    resized() {
      let canvas = this._canvas;
      //canvas.style.height = canvas.style.width = null;
      canvas.height = canvas.width = 0;
      //setTimeout(this.updateSize.bind(this), 0);
      this.updateSize();
    }

    refill() {
      /*
      let p = 2*r();
      if (p >= (this._paintables.length / this._starCount)) {
        this._paintables.push(
          this.createStar(this._h, this._w, true)
        );
      }*/
      var length = this._paintables.length;
      var maxCount = this._starCount;
      for (let i = 0, n = maxCount-length; i<n; ++i) {
        this._paintables.push(
          this.createStar(this._h, this._w, length > maxCount*0.8)
        );
      }
      this.requestRepaint();
    }

    redraw() {
      let ctx = this._canvas.getContext('2d');
      let h = this._h;
      let w = this._w;
      ctx.clearRect(0,0,w,h);
      for (let i=0,n=this._paintables.length; i<n;) {
        let p = this._paintables[i];
        p.paint(ctx);
        if (p.done(h,w)) {
          this._paintables.splice(i,1);
          --n;
        } else {
          ++i;
        }
      }
      this._repaintRequested = false;
      window.setTimeout(this.refill.bind(this), 0);
    }

    requestRepaint() {
      if (!this._repaintRequested) {
        this._repaintRequested = true;
        this._raf(this.redraw.bind(this));
      }
    }

    run() {
      let raf:(repaint:()=>void)=>void;
      if ('undefined' !== typeof window.requestAnimationFrame) {
        raf = window.requestAnimationFrame.bind(window);
      } else {
        raf = function(paint:()=>void) {
          window.setTimeout(paint, 15);
        };
      }
      this._raf = raf;
      this.requestRepaint();
    }
  }
}
