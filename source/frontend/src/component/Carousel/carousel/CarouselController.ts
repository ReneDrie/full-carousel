import EventDispatcher from 'seng-event';
import { DisposableEventListener } from 'seng-disposable-event-listener';
import { TweenMax, Linear, Power3 } from 'gsap';
import Draggable from 'gsap/Draggable';
import ModifiersPlugin from 'gsap/ModifiersPlugin';
import debounce from 'lodash/debounce';
import clamp from 'lodash/clamp';
import ThrowPropsPlugin from '../../../vendor/gsap/ThrowPropsPlugin';

import CarouselOptions from './CarouselOptions';
import CarouselEvent from './CarouselEvent';

/**
 *
 * Basic Class for generating a carousel with Draggable and an infinite option.
 * Only needs a wrapper (viewport) element, a container to drag, and an array of items.
 *
 * Has some simple options. Main thing right now is the "isInfinite" bool (default to true) that
 * makes the carousel infinite.
 *
 * Dependencies
 * ------------
 * - seng-event
 * - seng-disposable-event-listener
 * - gsap (TweenMax, Eases, Draggable, ModifiersPlugin)
 * - gsap ThrowPropsPlugin (is a Business Green bonus package)
 * - lodash (debounce, clamp)
 *
 *
 * Minimal needed HTML
 * -------------------
 *
   <div class="carousel">
    <div class="carousel-items">
      <div class="carousel-item"></div>
      <div class="carousel-item"></div>
      <div class="carousel-item"></div>
      <div class="carousel-item"></div>
      <div class="carousel-item"></div>
    </div>
   </div>
 *
 * Minimal needed CSS
 * ------------------
 *
   .carousel {
     position: relative;
     overflow: hidden;
   }

   .carousel-items {
     position: relative;
   }

   .carousel-item {
     position: absolute;
   }
 *
 * Vue implementation
 * ------------------
 *
   <Carousel
     ref="carousel"
     :items="items"
     :item-class="$style.carouselItem"
   >
     <div
       v-for="(item, index) in items"
       :slot="`item-${index}`"
       :key="`item-${index}`"
     >{{ item.title }}</div>
   </Carousel>
 *
 *
 */

export default class CarouselController extends EventDispatcher {
  private wrapperElement: HTMLElement;
  private dragElement: HTMLElement;
  private carouselItems: Array<HTMLElement>;
  private dragProxy: HTMLElement;

  private itemWidth: number = 0;
  private itemHeight: number = 0;
  private viewWidth: number = 0;

  private animation: TweenMax | null = null;
  private dragger!: Draggable;

  private snapIndex: number = 0;
  private previousSnapIndex: number = 0;

  private inViewIndexes: Array<number> = [];

  private resizeListener: DisposableEventListener;
  private autoplayInterval: number | null = null;

  private options: CarouselOptions = {
    hideOverflowItems: true,
    isInfinite: true,
    isAutoplay: false,
    autoplayTimeout: 5000,
    gotoAnimation: {
      ease: Power3.easeInOut,
      duration: 0.8,
    },
  };

  constructor(
    wrapperElement: HTMLElement,
    dragElement: HTMLElement,
    carouselItems: Array<HTMLElement>,
    options: Partial<CarouselOptions> = {},
  ) {
    super();

    this.options = Object.assign(this.options, options);

    this.wrapperElement = wrapperElement;
    this.dragElement = dragElement;
    this.carouselItems = carouselItems;

    this.dragProxy = document.createElement('div');
    this.wrapperElement.appendChild(this.dragProxy);

    this.updateSize();

    this.createAnimation();
    this.createDraggable();

    this.resizeListener = new DisposableEventListener(
      window,
      'resize',
      debounce(this.updateSize.bind(this), 150),
    );

    // Trigger the Animation because we want to update the inView events
    setTimeout(() => {
      this.setAnimationProgress(-0.0000000001);
    }, 0);

    this.startAutoplay();
  }

  /**
   * Getter for the real index. It's based on the "snapIndex" but limited to the amount of items.
   * Can be usefull for showing the correct active page
   */
  public get index(): number {
    const total = this.carouselItems.length;
    return ((this.snapIndex % total) + total) % total;
  }

  /**
   * Update size for after a resize of content change. Resets all styles and bounds
   */
  public updateSize(): void {
    this.setItemDimensions();
    this.setWrapperHeight();
    this.setItemPositions();

    if (this.dragger) {
      this.createAnimation();
      this.goto(this.snapIndex, 0.1, 0);
    }
  }

  /**
   * Activate Previous (slide or row)
   *
   * Default is just moving 1 item, but it's also possible to move the entire row
   * (the amount of items in the viewport)
   *
   * @param moveRow
   */
  public previous(moveRow: boolean = false): void {
    this.snapIndex -= moveRow ? Math.floor(this.viewWidth / this.itemWidth) : 1;
    this.goto(this.snapIndex);
  }

  /**
   * Activate Next (slide or row)
   *
   * Default is just moving 1 item, but it's also possible to move the entire row
   * (the amount of items in the viewport)
   *
   * @param moveRow
   */
  public next(moveRow: boolean = false): void {
    this.snapIndex += moveRow ? Math.floor(this.viewWidth / this.itemWidth) : 1;
    this.goto(this.snapIndex);
  }

  /**
   * Activate Specific item
   */
  public activate(index: number): void {
    this.snapIndex = this.getNearestRotationIndex(this.snapIndex, index, this.carouselItems.length);
    this.goto(this.snapIndex);
  }

  private setItemDimensions(): void {
    this.viewWidth = this.wrapperElement.offsetWidth;
    if (this.carouselItems && this.carouselItems.length > 0) {
      this.itemWidth = this.carouselItems[0].offsetWidth;
      this.itemHeight = Math.max(...this.carouselItems.map(element => element.offsetHeight));
    }
  }

  private setWrapperHeight(): void {
    this.wrapperElement.style.height = `${this.itemHeight}px`;
    this.dragElement.style.height = `${this.itemHeight}px`;
  }

  private setItemPositions(): void {
    TweenMax.staggerTo(
      this.carouselItems,
      0,
      {
        cycle: { x: (index: number) => this.itemWidth * (index + 1) },
      },
      0,
    );

    TweenMax.set(this.dragElement, { left: -this.itemWidth });
  }

  private createAnimation(): void {
    ModifiersPlugin;
    ThrowPropsPlugin;
    TweenMax.killTweensOf(this.carouselItems);
    this.animation = null;

    this.animation = TweenMax.to(this.carouselItems, 1, {
      x: `+=${this.itemWidth * this.carouselItems.length}`,
      ease: Linear.easeNone,
      paused: true,
      repeat: -1,
      modifiers: {
        x: this.getAnimationModifier.bind(this),
      },
    });
  }

  private createDraggable(): void {
    [this.dragger] = Draggable.create(this.dragProxy, {
      type: 'x',
      // force3d: true,
      trigger: this.dragElement,
      throwProps: true,
      overshootTolerance: this.options.isInfinite ? 1 : 0,
      onDragStart: this.stopAutoplay.bind(this),
      onDrag: this.onUpdateProgress.bind(this),
      onThrowUpdate: this.onUpdateProgress.bind(this),
      onThrowComplete: this.onThrowComplete.bind(this),
      bounds: this.getBounds(),
      snap: this.getSnap.bind(this),
    });
  }

  private getAnimationModifier(x: number, target: HTMLElement): number {
    const newX = x % (this.itemWidth * this.carouselItems.length);
    if (this.options.hideOverflowItems) {
      target.style.visibility = newX - this.itemWidth > this.viewWidth ? 'hidden' : 'visible';
    }

    if (newX > 0 && newX < this.viewWidth + this.itemWidth) {
      this.addInViewItem(target, newX);
    } else {
      this.removeInViewItem(target);
    }

    return newX;
  }

  private getSnap(endValue: number): number {
    this.snapIndex = Math.round(endValue / this.itemWidth) * -1;
    return this.snapIndex * -1 * this.itemWidth;
  }

  private onThrowComplete(): void {
    if (this.snapIndex !== this.previousSnapIndex) {
      this.dispatchEvent(new CarouselEvent(CarouselEvent.CHANGE, {}));
    }
    this.previousSnapIndex = this.snapIndex;
    this.startAutoplay();
  }

  private onUpdateProgress(): void {
    this.setAnimationProgress(this.dragger.x / (this.itemWidth * this.carouselItems.length));
    if (this.animation) {
      this.animation.progress();
    }
  }

  private getBounds(): { maxX: number; minX: number } | null {
    if (this.options.isInfinite) {
      return null;
    }

    return {
      maxX: 0,
      minX: -(this.itemWidth * this.carouselItems.length - this.viewWidth),
    };
  }

  private goto(
    index: number,
    duration: number = this.options.gotoAnimation.duration,
    delay: number = 0,
  ): void {
    this.stopAutoplay();
    TweenMax.to(this.dragger, duration, {
      delay,
      x: index * -1 * this.itemWidth,
      ease: this.options.gotoAnimation.ease,
      onUpdate: () => {
        TweenMax.set(this.dragProxy, { x: this.dragger.x });
        this.onUpdateProgress();
      },
      onStart: () => {
        this.dispatchEvent(new CarouselEvent(CarouselEvent.CHANGE, {}));
      },
      onComplete: () => {
        this.startAutoplay();
      },
    });
  }

  private addInViewItem(target: HTMLElement, currentX: number): void {
    const itemIndex = this.carouselItems.indexOf(target);
    const inViewIndex = this.inViewIndexes.indexOf(itemIndex);
    if (inViewIndex < 0) {
      this.dispatchEvent(new CarouselEvent(CarouselEvent.ITEM_IN_VIEW, { index: itemIndex }));
      this.inViewIndexes.push(itemIndex);
    }

    const progress = clamp(currentX / (this.viewWidth + this.itemWidth), 0, 1);
    this.dispatchEvent(
      new CarouselEvent(CarouselEvent.ITEM_IN_VIEW_PROGRESS, { progress, index: itemIndex }),
    );
  }

  private removeInViewItem(target: HTMLElement): void {
    const itemIndex = this.carouselItems.indexOf(target);
    const inViewIndex = this.inViewIndexes.indexOf(itemIndex);
    if (inViewIndex > -1) {
      this.inViewIndexes.splice(inViewIndex, 1);
      this.dispatchEvent(new CarouselEvent(CarouselEvent.ITEM_OUT_VIEW, { index: itemIndex }));
    }
  }

  private getNearestRotationIndex(index: number, newIndex: number, total: number): number {
    let curIndex = index;
    let updatedNewIndex = newIndex;

    while (curIndex < 0) {
      curIndex += total;
    }
    while (newIndex < 0) {
      updatedNewIndex += total;
    }

    const diff = Math.abs(curIndex - updatedNewIndex);

    if (diff > total / 2) {
      if (curIndex > updatedNewIndex) {
        return index + (total - diff);
      }
      return index - (total - diff);
    }

    if (curIndex < updatedNewIndex) {
      return index + diff;
    }
    return index - diff;
  }

  private startAutoplay(): void {
    if (this.options.isAutoplay) {
      this.autoplayInterval = setInterval(() => this.next(), this.options.autoplayTimeout);
    }
  }

  private stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  private setAnimationProgress(progress: number): void {
    if (this.animation) {
      this.animation.progress(progress);
    }
  }

  public dispose() {
    this.stopAutoplay();
    this.resizeListener.dispose();

    if (this.dragger) {
      this.dragger.kill();
    }
    if (this.animation) {
      this.animation.kill();
      this.animation = null;
    }

    TweenMax.killTweensOf(this.dragger);

    super.dispose();
  }
}
