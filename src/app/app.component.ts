import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'angular-elastic-side-bar';
  @ViewChild('path') path: ElementRef;
  @ViewChild('sideBar') sideBar: ElementRef;
  @ViewChild('sideBarContent') sideBarContent: ElementRef;
  // @ViewChild('chat') chat: ElementRef;
  @ViewChild('menu1') menu1: ElementRef;
  sideBarTop;
  sideBarLeft;

  diffX = 0;
  curX = 0;
  finalX = 0;
  frame = 1000 / 60;
  animTime = 600;
  sContTrans = 200;
  animating = false;

  startD;
  midD;
  finalD;
  clickMidD;
  clickMidDRev;
  clickD;
  currentPath;

  easings = {
    // returns new values for animation each time it is called
    smallElastic: (t, b, c, d) => {
      var ts = (t /= d) * t;
      var tc = ts * t;
      return (
        b + c * (33 * tc * ts + -106 * ts * ts + 126 * tc + -67 * ts + 15 * t)
      );
    },
    inCubic: (t, b, c, d) => {
      var tc = (t /= d) * t * t;
      return b + c * tc;
    },
  };

  pathValue = 'M0,0 20,0 a0,250 0 1,1 0,500 L0,500';

  ngOnInit() {}

  /**
   * creates a new arc parameters like a50,250
   * by replacing the two centers with new ones
   * @param {*} num1
   * @param {*} num2
   */
  newD(num1, num2 = 250) {
    let d = this.path.nativeElement.getAttribute('d');
    num2 = num2;
    let nd = d.replace(/\ba(\d+),(\d+)\b/gi, 'a' + num1 + ',' + num2);
    return nd;
  }

  ngAfterViewInit() {
    this.sideBarTop = this.sideBar.nativeElement.offsetTop;
    this.sideBarLeft = this.sideBar.nativeElement.offsetLeft;
    this.startD = this.createD(20, 0, 1);
    this.midD = this.createD(125, 75, 0);
    this.finalD = this.createD(200, 0, 1);
    this.clickMidD = this.createD(300, 80, 0);
    this.clickMidDRev = this.createD(200, 100, 1);
    this.clickD = this.createD(300, 0, 1);
    this.currentPath = this.startD;

    this.handlers1();
  }

  createD(top, ax, dir) {
    return 'M0,0 ' + top + ',0 a' + ax + ',250 0 1,' + dir + ' 0,500 L0,500';
  }

  animatePathD(
    path,
    d,
    time,
    handlers,
    callback = null,
    easingTop = null,
    easingX = null
  ) {
    var steps = Math.floor(time / this.frame);
    let curStep = 0;
    let oldArr = this.currentPath.split(' ');
    let newArr = d.split(' ');
    let oldTop = +oldArr[1].split(',')[0];
    let topDiff = +newArr[1].split(',')[0] - oldTop;
    let nextTop;
    let nextX;
    easingTop = this.easings[easingTop] || this.easings.smallElastic;
    easingX = this.easings[easingX] || easingTop;

    const animate = () => {
      curStep++;
      nextTop = easingTop(curStep, oldTop, topDiff, steps);
      nextX = easingX(curStep, this.curX, this.finalX - this.curX, steps);
      oldArr[1] = nextTop + ',0';
      oldArr[2] = 'a' + Math.abs(nextX) + ',250';
      oldArr[4] = nextX >= 0 ? '1,1' : '1,0';
      this.pathValue = oldArr.join(' ');
      if (curStep > steps) {
        this.curX = 0;
        this.diffX = 0;
        this.pathValue = d;
        this.currentPath = d;
        if (handlers) this.handlers1();
        if (callback) callback();
        return;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  handlers1() {
    const mousedownTouchstart = (event) => {
      var startX = event.pageX || event.targetTouches[0].pageX;

      // update path when the user drags the white side bar ( creates curve like structure )
      const touchmoveMousemove = (e) => {
        var x = e.pageX || e.changedTouches[0].pageX;
        this.diffX = x - startX;
        // console.log(x, startX, this.diffX);
        if (this.currentPath == this.finalD) return;
        if (this.diffX < 0) this.diffX = 0;
        if (this.diffX > 300) this.diffX = 300;
        this.curX = Math.floor(this.diffX / 2);
        this.pathValue = this.newD(this.curX);
      };
      document.ontouchmove = touchmoveMousemove;
      document.onmousemove = touchmoveMousemove;
    };

    this.sideBar.nativeElement.onmousedown = mousedownTouchstart;
    this.sideBar.nativeElement.ontouchstart = mousedownTouchstart;

    const mouseupTouchEnd = () => {
      const touchmoveMousemove = (e) => {
        e.preventDefault();
      };
      document.onmousemove = touchmoveMousemove;
      document.ontouchmove = touchmoveMousemove;

      if (this.animating) return;
      if (!this.diffX) return;
      if (this.currentPath == this.finalD) return;
      if (this.diffX < 40) {
        this.animatePathD(null, this.newD(0), this.animTime, true);
      } else {
        this.animatePathD(null, this.finalD, this.animTime, false, () => {
          // this.chat.nativeElement.style.display = 'block';
          this.closeSidebar();
          setTimeout(() => {
            document.onclick = (e) => {
              this.closeSidebar(e);
            };
          }, this.sContTrans);
        });
      }
    };

    document.onmouseup = mouseupTouchEnd;
    document.ontouchend = mouseupTouchEnd;
  }

  closeSidebar(e = null, menu = null) {
    if (e && e.clientX < 200 && !menu) return;
    if (this.animating) return;
    this.sideBarContent.nativeElement.classList.add('active');
    if (!e) return;
    this.animating = true;
    this.sideBarContent.nativeElement.classList.remove('active');
    this.finalX = -75;
    setTimeout(() => {
      this.animatePathD(
        null,
        this.midD,
        this.animTime / 3,
        false,
        () => {
          // this.chat.nativeElement.style.display = 'none';
          this.finalX = 0;
          this.curX = -75;
          this.animatePathD(null, this.startD, (this.animTime / 3) * 2, true);
          this.animating = false;
        },
        'inCubic'
      );
    }, this.sContTrans);
    document.onclick = (event) => {
      event.preventDefault();
    };
  }

  collapse(event) {
    console.log(event);
    setTimeout(() => {
      this.closeSidebar(event, 'menu');
    }, 400);
  }

  // ripple(elem, e) {
  //   var elTop = elem.offset().top,
  //     elLeft = elem.offset().left,
  //     x = e.pageX - elLeft,
  //     y = e.pageY - elTop;
  //   var $ripple = $("<div class='ripple'></div>");
  //   $ripple.css({ top: y, left: x });
  //   elem.append($ripple);
  // }

  menuClick(event) {
    console.log(event);
  }
}
