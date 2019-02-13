<style src="./HomePage.scss" module lang="scss"></style>
<script src="./HomePage.js"></script>

<template>
  <div :class="[$style.homePage]">
    <Carousel
      ref="carousel"
      :class="$style.carousel"
      :items="items"
      :item-class="$style.carouselItem"
    >
      <div
        v-for="(item, index) in items"
        :slot="`item-${index}`"
        :key="`item-${index}`"
      >{{ item.title }}</div>
    </Carousel>

    <nav :class="$style.navigation">
      <button @click="onPreviousClick(true)">Previous row</button>
      <button @click="onPreviousClick">Previous item</button>
      <button @click="onNextClick">Next item</button>
      <button @click="onNextClick(true)">Next row</button>

      <ul :class="$style.pagination">
        <li
          v-for="(item, index) in items"
          :key="`pagination-${index}`"
        >
          <button @click="onPaginateClick(index)">{{ index + 1 }}</button>
        </li>
      </ul>
    </nav>
  </div>
</template>
