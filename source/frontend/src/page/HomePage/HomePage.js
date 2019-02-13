// @vue/component
import CarouselController from '../../component/Carousel';

export default {
  name: 'HomePage',
  components: {
    Carousel: CarouselController,
  },
  data: () => ({
    items: new Array(5).fill(0).map((data, index) => ({
      index: index + 1,
      title: `Title ${index + 1}`,
    })),
  }),
  methods: {
    onPreviousClick(row) {
      const isRow = typeof row === 'boolean' && row;
      this.$refs.carousel.previous(isRow);
    },
    onNextClick(row) {
      const isRow = typeof row === 'boolean' && row;
      this.$refs.carousel.next(isRow);
    },
    onPaginateClick(index) {
      this.$refs.carousel.activate(index);
    },
  },
};
