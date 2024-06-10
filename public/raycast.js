const TILE_SIZE = 64;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const MINIMAP_SCALE_FACTOR = 0.2;
const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

// 视野范围
const FOV_ANGLE = 60 * (Math.PI / 180);

// 墙的宽度
const WALL_STRIP_WIDTH = 1;
// 光线数量
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

class MapGrid {
  constructor() {
    this.grid = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
  }

  render() {
    for (let row = 0; row < MAP_NUM_ROWS; row++) {
      for (let col = 0; col < MAP_NUM_COLS; col++) {
        let x = col * TILE_SIZE;
        let y = row * TILE_SIZE;

        let tile = this.grid[row][col];

        if (tile === 1) {
          fill(0);
        } else {
          fill(255);
        }
        stroke("#000");
        rect(
          x * MINIMAP_SCALE_FACTOR,
          y * MINIMAP_SCALE_FACTOR,
          TILE_SIZE * MINIMAP_SCALE_FACTOR,
          TILE_SIZE * MINIMAP_SCALE_FACTOR
        );
      }
    }
  }

  hasWellAt(x, y) {
    if (x < 0 || y < 0 || x >= WINDOW_WIDTH || y >= WINDOW_HEIGHT) {
      return true;
    }
    let row = Math.floor(y / TILE_SIZE);
    let col = Math.floor(x / TILE_SIZE);
    return this.grid[row][col] === 1;
  }
}

class Player {
  constructor() {
    this.x = WINDOW_HEIGHT / 2;
    this.y = WINDOW_HEIGHT / 2;
    this.radius = 3;
    this.turnDirection = 0; // -1 Right 1 Left;
    this.walkDirection = 0; // -1 Down 1 Up;
    this.rotationAngle = 90 * (Math.PI / 180);
    this.moveSpeed = 2.0;
    this.rotationSpeed = 2 * (Math.PI / 180);
  }

  update() {
    this.rotationAngle += this.turnDirection * this.rotationSpeed;
    let moveSpeed = this.walkDirection * this.moveSpeed;
    let newPlayerX = this.x + moveSpeed * Math.cos(this.rotationAngle);
    let newPlayerY = this.y + moveSpeed * Math.sin(this.rotationAngle);
    if (!grid.hasWellAt(newPlayerX, newPlayerY)) {
      this.x = newPlayerX;
      this.y = newPlayerY;
    }
  }

  render() {
    noStroke();
    fill("red");
    circle(
      this.x * MINIMAP_SCALE_FACTOR,
      this.y * MINIMAP_SCALE_FACTOR,
      this.radius * MINIMAP_SCALE_FACTOR
    );
    stroke("red");
    line(
      this.x * MINIMAP_SCALE_FACTOR,
      this.y * MINIMAP_SCALE_FACTOR,
      this.x * MINIMAP_SCALE_FACTOR +
        Math.cos(this.rotationAngle) * 30 * MINIMAP_SCALE_FACTOR,
      this.y * MINIMAP_SCALE_FACTOR +
        Math.sin(this.rotationAngle) * 30 * MINIMAP_SCALE_FACTOR
    );
  }
}

class Ray {
  constructor(rayAngle) {
    // TODO
    this.rayAngle = normalizeAngle(rayAngle);
    this.wallHitX = 0;
    this.wallHitY = 0;
    this.distance = 0;
    this.wasHitVertical = false;

    this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
    this.isRayFacingUp = !this.isRayFacingDown;
    this.isRayFacingRight =
      this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI;
    this.isRayFacingLeft = !this.isRayFacingRight;
  }

  cast(columnId) {
    let xintercept, yintercept;
    let xstep, ystep;

    ////////////////////////////////
    // 水平方向
    ////////////////////////////////
    let foundHorzWallHit = false;
    let horzWallHitX = 0;
    let horzWallHitY = 0;

    yintercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
    yintercept += this.isRayFacingDown ? TILE_SIZE : 0;

    xintercept = player.x + (yintercept - player.y) / Math.tan(this.rayAngle);

    ystep = TILE_SIZE;
    ystep *= this.isRayFacingUp ? -1 : 1;

    xstep = TILE_SIZE / Math.tan(this.rayAngle);
    xstep *= this.isRayFacingLeft && xstep > 0 ? -1 : 1;
    xstep *= this.isRayFacingRight && xstep < 0 ? -1 : 1;

    let nextHorzTouchX = xintercept;
    let nextHorzTouchY = yintercept;

    // if (this.isRayFacingUp) nextHorzTouchY--;

    while (
      nextHorzTouchX >= 0 &&
      nextHorzTouchX <= WINDOW_WIDTH &&
      nextHorzTouchY >= 0 &&
      nextHorzTouchY <= WINDOW_HEIGHT
    ) {
      if (
        grid.hasWellAt(
          nextHorzTouchX,
          nextHorzTouchY - (this.isRayFacingUp ? 1 : 0)
        )
      ) {
        foundHorzWallHit = true;
        horzWallHitX = nextHorzTouchX;
        horzWallHitY = nextHorzTouchY;

        stroke("green");
        // line(player.x, player.y, horzWallHitX, horzWallHitY);
        // console.log("foundHorzWallHit", player.x, player.y);
        break;
      } else {
        nextHorzTouchX += xstep;
        nextHorzTouchY += ystep;
      }
    }

    // return;
    ////////////////////////////////
    // 垂直方向
    ////////////////////////////////
    let foundVertWallHit = false;
    let vertWallHitX = 0;
    let vertWallHitY = 0;

    xintercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
    xintercept += this.isRayFacingRight ? TILE_SIZE : 0;

    yintercept = player.y + (xintercept - player.x) * Math.tan(this.rayAngle);

    xstep = TILE_SIZE;
    xstep *= this.isRayFacingLeft ? -1 : 1;

    ystep = TILE_SIZE * Math.tan(this.rayAngle);
    ystep *= this.isRayFacingUp && ystep > 0 ? -1 : 1;
    ystep *= this.isRayFacingDown && ystep < 0 ? -1 : 1;

    let nextVertTouchX = xintercept;
    let nextVertTouchY = yintercept;

    // if (this.isRayFacingLeft) nextVertTouchX--;

    while (
      nextVertTouchX >= 0 &&
      nextVertTouchX <= WINDOW_WIDTH &&
      nextVertTouchY >= 0 &&
      nextVertTouchY < WINDOW_HEIGHT
    ) {
      if (
        grid.hasWellAt(
          nextVertTouchX - (this.isRayFacingLeft ? 1 : 0),
          nextVertTouchY
        )
      ) {
        foundVertWallHit = true;
        vertWallHitX = nextVertTouchX;
        vertWallHitY = nextVertTouchY;

        // stroke("#000");
        // line(player.x, player.y, vertWallHitX, vertWallHitY);
        break;
      } else {
        nextVertTouchX += xstep;
        nextVertTouchY += ystep;
      }
    }

    // 比较最小值
    var horzHitDistance = foundHorzWallHit
      ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY)
      : Number.MAX_VALUE;

    var vertHitDistance = foundVertWallHit
      ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY)
      : Number.MAX_VALUE;

    this.wallHitX =
      horzHitDistance < vertHitDistance ? horzWallHitX : vertWallHitX;
    this.wallHitY =
      horzHitDistance < vertHitDistance ? horzWallHitY : vertWallHitY;

    this.distance =
      horzHitDistance < vertHitDistance ? horzHitDistance : vertHitDistance;
    this.wasHitVertical = vertHitDistance < horzHitDistance;
  }

  render() {
    // TODO
    stroke("rgba(255, 0, 0, 0.3)");
    line(
      player.x * MINIMAP_SCALE_FACTOR,
      player.y * MINIMAP_SCALE_FACTOR,
      this.wallHitX * MINIMAP_SCALE_FACTOR,
      this.wallHitY * MINIMAP_SCALE_FACTOR
    );
    // line(
    //   player.x,
    //   player.y,
    //   player.x + Math.cos(this.rayAngle) * 30,
    //   player.y + Math.sin(this.rayAngle) * 30
    // );
  }
}

const grid = new MapGrid();
const player = new Player();
let rays = [];

function keyPressed() {
  if (keyCode == UP_ARROW) {
    player.walkDirection = 1;
  } else if (keyCode == DOWN_ARROW) {
    player.walkDirection = -1;
  } else if (keyCode == RIGHT_ARROW) {
    player.turnDirection = 1;
  } else if (keyCode == LEFT_ARROW) {
    player.turnDirection = -1;
  }
}

function keyReleased() {
  if (keyCode == UP_ARROW) {
    player.walkDirection = 0;
  } else if (keyCode == DOWN_ARROW) {
    player.walkDirection = 0;
  } else if (keyCode == RIGHT_ARROW) {
    player.turnDirection = 0;
  } else if (keyCode == LEFT_ARROW) {
    player.turnDirection = 0;
  }
}

function render3DProjectWalls() {
  for (let i = 0; i < NUM_RAYS; i++) {
    let ray = rays[i];
    let rayDistance =
      ray.distance * Math.cos(ray.rayAngle - player.rotationAngle);
    let distanceProjectionPlane = WINDOW_WIDTH / 2 / Math.tan(FOV_ANGLE / 2);
    let wallStripHeight = (TILE_SIZE / rayDistance) * distanceProjectionPlane;

    fill("rgba(255, 255, 255, 1)");
    noStroke();
    rect(
      i * WALL_STRIP_WIDTH,
      WINDOW_HEIGHT / 2 - wallStripHeight / 2,
      WALL_STRIP_WIDTH,
      wallStripHeight
    );
  }
}

function normalizeAngle(angle) {
  angle = angle % (2 * Math.PI);
  if (angle < 0) {
    angle = 2 * Math.PI + angle;
  }
  return angle;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function setup() {
  createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);
}

function castAllRays() {
  // TODO

  let columnId = 0;
  let rayAngle = player.rotationAngle - FOV_ANGLE / 2;
  rays = [];
  // NUM_RAYS
  for (let i = 0; i < NUM_RAYS; i++) {
    let ray = new Ray(rayAngle);
    ray.cast(columnId);
    rays.push(ray);
    rayAngle += FOV_ANGLE / NUM_RAYS;

    columnId++;
  }
}

function update() {
  player.update();

  castAllRays();
}

function draw() {
  clear("#212121");
  background("rgb(125, 124, 122)");
  update();

  render3DProjectWalls();
  grid.render();

  for (const ray of rays) {
    ray.render();
  }
  player.render();
}
