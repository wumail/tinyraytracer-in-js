class Vec3 extends Array {
  x: number;
  y: number;
  z: number;
  constructor(x: number, y: number, z: number) {
    super(3);
    this[0] = x;
    this[1] = y;
    this[2] = z;
    this.x = x;
    this.y = y;
    this.z = z;
    Object.setPrototypeOf(this, Vec3.prototype);
  }
  add({ x, y, z }: Vec3): Vec3 {
    return new Vec3(this.x + x, this.y + y, this.z + z);
  }
  subtract({ x, y, z }: Vec3): Vec3 {
    return new Vec3(this.x - x, this.y - y, this.z - z);
  }
  multiply(dt: number): Vec3 {
    return new Vec3(this.x * dt, this.y * dt, this.z * dt);
  }
  dot({ x, y, z }: Vec3) {
    return this.x * x + this.y * y + this.z * z;
  }
  cross({ x, y, z }: Vec3) {
    return new Vec3(
      this.y * z - this.z * y,
      this.z * x - this.x * z,
      this.x * y - this.y * x
    );
  }
  normalize() {
    const len = this.getLength();
    return new Vec3(this.x / len, this.y / len, this.z / len);
  }
  getLength() {
    return Math.hypot(this.x, this.y, this.z);
  }
}
export default Vec3;
