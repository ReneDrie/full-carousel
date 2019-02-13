import VueTypes from 'vue-types';
import CarouselController from './carousel/CarouselController';
import CarouselEvent from './carousel/CarouselEvent';

// @vue/component
export default {
  name: 'Carousel',
  props: {
    items: VueTypes.array.isRequired,
    itemClass: VueTypes.string.def(''),
  },
  mounted() {
    this.carousel = new CarouselController(this.$el, this.$refs.items, this.$refs.item, {
      isInfinite: false,
    });

    this.carousel.addEventListener(CarouselEvent.CHANGE, this.onCarouselChange);
  },
  methods: {
    previous(isRow) {
      this.carousel.previous(isRow);
    },
    next(isRow) {
      this.carousel.next(isRow);
    },
    activate(index) {
      this.carousel.activate(index);
    },

    onCarouselChange() {
      // console.log(this.carousel.index, this.carousel.snapIndex);
    },
  },
};
