<style src="./Carousel.scss" module lang="scss"></style>
<script src="./Carousel.js"></script>

<template>
  <div :class="$style.carousel">
    <ul
      ref="items"
      :class="$style.carouselItems"
    >
      <li
        v-for="(item, index) in items"
        ref="item"
        :key="`item-${index}`"
        :class="[$style.carouselItem, itemClass]"
      >
        <slot
          :scope="item"
          :name="`item-${index}`"
        />
      </li>
    </ul>
  </div>
</template>
