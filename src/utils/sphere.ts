import Vec3 from "./vec3";

class Material {
  public diffuseColor: Vec3;
  public albedo: [number, number, number, number];
  public specularExponent: number;
  public refract_index: number;
  constructor(
    diffuseColor: Vec3 = new Vec3(0, 0, 0),
    albedo: [number, number, number, number] = [1, 0, 0, 0],
    specularExponent: number = 50,
    refract_index: number = 1
  ) {
    this.diffuseColor = diffuseColor;
    this.albedo = albedo;
    this.specularExponent = specularExponent;
    this.refract_index = refract_index;
  }
}

class Light {
  public position: Vec3;
  public intensity: number;
  constructor(position: Vec3, intensity: number) {
    this.position = position;
    this.intensity = intensity;
  }
}

class Sphere {
  public center: Vec3;
  public radius: number;
  public material: Material;
  constructor(center: Vec3, radius: number, material: Material) {
    this.center = center;
    this.radius = radius;
    this.material = material;
  }
  ray_intersect(origin: Vec3, direction: Vec3, dist_info: any) {
    const L = this.center.subtract(origin) as Vec3;
    const tca = L.dot(direction);
    const d2 = L.dot(L) - tca * tca;
    if (d2 > this.radius * this.radius) return false;
    const thc = Math.sqrt(this.radius * this.radius - d2);
    dist_info.dist_i = tca - thc;
    const t1 = tca + thc;
    if (dist_info.dist_i < 0) dist_info.dist_i = t1;
    if (dist_info.dist_i < 0) return false;
    return true;
  }
}

export default Sphere;
export { Material, Light };
