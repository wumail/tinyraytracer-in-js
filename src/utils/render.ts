import Vec3 from "./vec3";
import Sphere, { Light, Material } from "./sphere";

export type Tuple = [number, number, number];

const width = 1024;
const height = 768;
const fov = Math.PI / 1.8;

function reflect(I: Vec3, N: Vec3): Vec3 {
  return I.subtract(N.multiply(2 * I.dot(N)));
}

function refract(I: Vec3, N: Vec3, refract_index: number): Vec3 {
  let cosi = Math.max(-1, Math.min(1, I.dot(N)));
  let etai = 1,
    etat = refract_index;
  let n = N;
  if (cosi < 0) {
    cosi = -cosi;
  } else {
    [etai, etat] = [etat, etai];
    n = N.multiply(-1);
  }
  const eta = etai / etat;
  const k = 1 - eta ** 2 * (1 - cosi ** 2);
  return k < 0
    ? new Vec3(0, 0, 0)
    : I.multiply(eta).add(n.multiply(eta * cosi - Math.sqrt(k)));
}

function scene_intersect(
  orig: Vec3,
  dir: Vec3,
  spheres: Sphere[],
  material: Material,
  hit_info: any
): boolean {
  const dist_info = {
    spheres_dist: Infinity,
    dist_i: 0,
  };
  for (let i = 0; i < spheres.length; i++) {
    if (
      spheres[i].ray_intersect(orig, dir, dist_info) &&
      dist_info.dist_i < dist_info.spheres_dist
    ) {
      dist_info.spheres_dist = dist_info.dist_i;
      hit_info.hit = orig.add(dir.multiply(dist_info.dist_i));
      hit_info.normal = hit_info.hit.subtract(spheres[i].center).normalize();

      material.diffuseColor = spheres[i].material.diffuseColor;
      material.albedo = spheres[i].material.albedo;
      material.specularExponent = spheres[i].material.specularExponent;
      material.refract_index = spheres[i].material.refract_index;
    }
  }
  let checkerboard_dist = Infinity;
  if (Math.abs(dir.y) > 1e-3) {
    const t = -(orig.y + 4) / dir.y;
    const pt = orig.add(dir.multiply(t));
    if (
      t > 1e-3 &&
      Math.abs(pt.x) < 10 &&
      pt.z < -10 &&
      pt.z > -30 &&
      t < dist_info.spheres_dist
    ) {
      checkerboard_dist = t;
      hit_info.hit = pt;
      hit_info.normal = new Vec3(0, 1, 0);
      material.diffuseColor =
        (Math.floor(pt.x) + Math.floor(pt.z)) & 1
          ? new Vec3(0.3, 0.3, 0.3)
          : new Vec3(0.3, 0.2, 0.1);
    }
  }
  return Math.min(dist_info.spheres_dist, checkerboard_dist) < 1000;
}

function cast_ray(
  orig: Vec3,
  dir: Vec3,
  spheres: Sphere[],
  lights: Light[],
  depth: number = 0,
  envmap: ImageData
): Vec3 {
  const material = new Material();
  const hit_info = {
    normal: new Vec3(0, 0, 0),
    hit: new Vec3(0, 0, 0),
  };
  if (depth > 4 || !scene_intersect(orig, dir, spheres, material, hit_info)) {
    let a = Math.max(
      0,
      Math.min(
        envmap.width - 1,
        Math.floor(
          (Math.atan2(dir.z, dir.x) / (2 * Math.PI) + 0.5) * envmap.width
        )
      )
    );
    let b = Math.max(
      0,
      Math.min(
        envmap.height - 1,
        Math.floor((Math.acos(dir.y) / Math.PI) * envmap.height)
      )
    );
    const index = (a + b * envmap.width) * 4;
    return new Vec3(
      envmap.data[index] / 255,
      envmap.data[index + 1] / 255,
      envmap.data[index + 2] / 255
    );
  }

  const reflect_dir = reflect(dir, hit_info.normal);
  const reflect_orig =
    reflect_dir.dot(hit_info.normal) < 0
      ? hit_info.hit.subtract(hit_info.normal.multiply(1e-3))
      : hit_info.hit.add(hit_info.normal.multiply(1e-3));
  const reflect_color = cast_ray(
    reflect_orig,
    reflect_dir,
    spheres,
    lights,
    depth + 1,
    envmap
  );

  const refract_dir = refract(dir, hit_info.normal, material.refract_index);
  const refract_orig =
    refract_dir.dot(hit_info.normal) < 0
      ? hit_info.hit.subtract(hit_info.normal.multiply(1e-3))
      : hit_info.hit.add(hit_info.normal.multiply(1e-3));
  const refract_color = cast_ray(
    refract_orig,
    refract_dir,
    spheres,
    lights,
    depth + 1,
    envmap
  );

  let diffuse_light_intensity = 0;
  let specular_light_intensity = 0;

  for (let i = 0; i < lights.length; i++) {
    const light_dir = lights[i].position.subtract(hit_info.hit).normalize();
    const light_distance = lights[i].position
      .subtract(hit_info.hit)
      .getLength();
    const shadow_orig =
      light_dir.dot(hit_info.normal) < 0
        ? hit_info.hit.subtract(hit_info.normal.multiply(1e-3))
        : hit_info.hit.add(hit_info.normal.multiply(1e-3));
    const shadow_hit_info = {
      normal: new Vec3(0, 0, 0),
      hit: new Vec3(0, 0, 0),
    };
    const tmpMaterial = new Material();
    if (
      scene_intersect(
        shadow_orig,
        light_dir,
        spheres,
        tmpMaterial,
        shadow_hit_info
      ) &&
      shadow_hit_info.hit.subtract(shadow_orig).getLength() < light_distance
    ) {
      continue;
    }
    diffuse_light_intensity +=
      lights[i].intensity * Math.max(0, light_dir.dot(hit_info.normal));
    specular_light_intensity +=
      Math.pow(
        Math.max(0, reflect(light_dir, hit_info.normal).dot(dir)),
        material.specularExponent
      ) * lights[i].intensity;
  }

  return material.diffuseColor
    .multiply(diffuse_light_intensity * material.albedo[0])
    .add(
      new Vec3(1, 1, 1).multiply(specular_light_intensity * material.albedo[1])
    )
    .add(reflect_color.multiply(material.albedo[2]))
    .add(refract_color.multiply(material.albedo[3]));
}

function* render(
  ctx: any,
  spheres: Sphere[],
  lights: Light[],
  envmap: ImageData
) {
  const imageData: ImageData = ctx!.getImageData(0, 0, width, height);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = i + 0.5 - width / 2;
      const y = -(j + 0.5) + height / 2;
      const z = -height / Math.tan(fov / 2);
      const dir = new Vec3(x, y, z).normalize();
      let frame = cast_ray(new Vec3(0, 0, 0), dir, spheres, lights, 0, envmap);
      const index = (i + j * width) * 4;
      const max = Math.max(...frame);
      if (max > 1) {
        frame = frame.multiply(1 / max);
      }
      imageData.data[index] = Math.max(0, Math.min(frame.x, 1)) * 255;
      imageData.data[index + 1] = Math.max(0, Math.min(frame.y, 1)) * 255;
      imageData.data[index + 2] = Math.max(0, Math.min(frame.z, 1)) * 255;
      imageData.data[index + 3] = 255;
    }
    // if(!(j & 31)) yield;
    // ctx.putImageData(imageData, 0, 0);
    yield imageData;
  }
  // yield 'done'
  return null
}

export { render, width, height };
