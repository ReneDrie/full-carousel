import { Ease } from 'gsap';

export default interface CarouselOptions {
  hideOverflowItems: boolean;
  isInfinite: boolean;
  isAutoplay: boolean;
  autoplayTimeout: number;
  gotoAnimation: {
    ease: Ease;
    duration: number;
  };
}
