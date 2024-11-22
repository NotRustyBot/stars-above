export type Vectorlike = { x: number, y: number }

export class Vector {
    /**
     * @param {number[][]} values values[row][colum]
     * @returns {Matrix2x2}
     */
    x: number;
    y: number;
    constructor(x: number = 0, y: number = 0) {
        /**@type {number} X coordinate */
        this.x = x;
        /**@type {number} Y coordinate */
        this.y = y;
    }

    xy(): [number, number] {
        return [this.x, this.y];
    }

    toLike(): Vectorlike {
        return { x: this.x, y: this.y }
    }

    set(x: number, y: number): Vector {
        this.x = x;
        this.y = y;
        return this
    }

    rotate(angle: number): Vector {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    distance(vector: Vectorlike): number {
        const x = this.x - vector.x;
        const y = this.y - vector.y;
        return Math.sqrt(x**2 + y**2);
    }

    distanceSquared(vector: Vectorlike): number {
        const v = new Vector(Math.abs(this.x - vector.x), Math.abs(this.y - vector.y));
        return v.lengthSquared();
    }

    add(vector: Vectorlike): Vector {
        this.x = this.x + vector.x;
        this.y = this.y + vector.y;
        return this;
    }

    sub(vector: Vectorlike): Vector {
        this.x = this.x - vector.x;
        this.y = this.y - vector.y;
        return this;
    }

    diff(vector: Vectorlike): Vector {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    mult(magnitude: number): Vector {
        this.x = this.x * magnitude;
        this.y = this.y * magnitude;
        return this;
    }

    normalize(length: number = 1): Vector {
        length = length ?? 1;
        const total = this.length();
        this.x = (this.x / total) * length;
        this.y = (this.y / total) * length;
        return this;
    }

    toAngle(): number {
        return Math.atan2(this.y, this.x);
    }

    result() {
        return new Vector(this.x, this.y);
    }

    inbound(bound: number): boolean {
        return this.x < bound && this.x > -bound && this.y < bound && this.y > -bound;
    }

    toString(): string {
        return "[X: " + this.x.toFixed(3) + " Y: " + this.y.toFixed(3) + "]";
    }

    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @param {Vector} v3
     * @return {Vector} (v1 x v2) x v3
     */
    static tripleCross(v1: Vector, v2: Vector, v3: Vector): Vector {
        const cross = v1.x * v2.y - v1.y * v2.x;
        return new Vector(-v3.y * cross, v3.x * cross);
    }

    static fromAngle(r: number): Vector {
        return new Vector(Math.cos(r), Math.sin(r));
    }

    static fromLike(v: Vectorlike): Vector {
        return new Vector(v.x, v.y);
    }

    static cross(v1: Vector, v2: Vector): number {
        return v1.x * v2.y - v1.y * v2.x;
    }

    static add(v1: Vector, v2: Vector): Vector {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }
    static dot(v1: Vectorlike, v2: Vectorlike): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * @param {Vector} A point on line
     * @param {Vector} B point on line
     * @param {Vector} C distanced point
     * @return {number}
     * https://www.youtube.com/watch?v=KHuI9bXZS74
     */
    static distanceToLine(A: Vector, B: Vector, C: Vector): number {
        return (
            Math.abs((C.x - A.x) * (-B.y + A.y) + (C.y - A.y) * (B.x - A.x)) /
            Math.sqrt((-B.y + A.y) * (-B.y + A.y) + (B.x - A.x) * (B.x - A.x))
        );
    }

    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @return {boolean} two vectors have same values
     */
    static equals(v1: Vector, v2: Vector): boolean {
        return v1.x == v2.x && v1.y == v2.y;
    }
}

export class Matrix2x2 {
    values: number[][];
    /**
     * @param {number[][]} values values[row][colum]
     * @returns {Matrix2x2}
     */
    constructor(values: number[][]) {
        this.values = values;
    }

    /**
     * @param {number} angle
     * @returns {Matrix2x2}
     * create rotation matrix
     */
    static fromAngle(angle: number): Matrix2x2 {
        return new Matrix2x2([
            [Math.cos(angle), -Math.sin(angle)],
            [Math.sin(angle), Math.cos(angle)],
        ]);
    }

    /**
     * @param {Vector} vect
     * @return {Vector}
     */
    transform(vect: Vector): Vector {
        return new Vector(
            vect.x * this.values[0][0] + vect.y * this.values[0][1],
            vect.x * this.values[1][0] + vect.y * this.values[1][1]
        );
    }
}
