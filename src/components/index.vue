<template>
  <canvas id="main-graph" :width="width" :height="height" />
  <canvas id="env" :width="imgWidth" :height="imgHeight" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { render, width, height } from "../utils/render";
import Sphere, { Material, Light } from "../utils/sphere";
import Vec3 from "../utils/vec3";

const imgHeight = ref(3808);
const imgWidth = ref(7616);

const ivory = new Material(
  new Vec3(0.4, 0.4, 0.3),
  [0.6, 0.3, 0.1, 0.0],
  50,
  1
);
const red_rubber = new Material(
  new Vec3(0.3, 0.1, 0.1),
  [0.9, 0.1, 0.0, 0.0],
  10,
  1
);
const mirror = new Material(
  new Vec3(1.0, 1.0, 1.0),
  [0.0, 10.0, 0.8, 0.0],
  1425,
  1
);
const glass = new Material(
  new Vec3(0.6, 0.7, 0.8),
  [0.0, 0.5, 0.1, 0.8],
  125,
  1.5
);
const lights = [
  new Light(new Vec3(-20, 20, 20), 1.5),
  new Light(new Vec3(30, 50, -25), 1.8),
  new Light(new Vec3(30, 20, 30), 1.7),
];
const spheres = [];
spheres.push(new Sphere(new Vec3(-3, 0, -16), 2, ivory));
spheres.push(new Sphere(new Vec3(-1.0, -1.5, -12), 2, glass));
spheres.push(new Sphere(new Vec3(1.5, -0.5, -18), 3, red_rubber));
spheres.push(new Sphere(new Vec3(7, 5, -18), 4, mirror));

onMounted(() => {
  const env = document.getElementById("env");
  const canvas = document.getElementById("main-graph");
  const image = new Image();
  image.src = "./envmap.jpg";
  image.onload = () => {
    const envCtx = env.getContext("2d");
    const ctx = canvas.getContext("2d");
    envCtx.drawImage(image, 0, 0);
    const envmap = envCtx.getImageData(0, 0, image.width, image.height);
    const pixelGenerator = render(ctx, spheres, lights, envmap);
    const renderTask = setInterval(function () {
      const value = pixelGenerator.next().value;
      if (!value) {
        clearInterval(renderTask);
      }else {
        ctx.putImageData(value, 0, 0)
      }
      // if(pixelGenerator.next().value) {
      //   clearInterval(renderTask);
      // }
    }, 0);
  };
});
</script>
<style scoped>
#main-graph {
  display: block;
  margin: auto;
}
#env {
  display: none;
}
</style>
