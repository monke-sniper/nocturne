export class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(x, y) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  insert(entity) {
    const key = this._key(entity.x, entity.y);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
  }

  query(x, y, radius, result = []) {
    result.length = 0;
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const r2 = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(`${cx},${cy}`);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const e = cell[i];
            const dx = e.x - x;
            const dy = e.y - y;
            if (dx * dx + dy * dy <= r2) {
              result.push(e);
            }
          }
        }
      }
    }
    return result;
  }

  each(fn) {
    for (const cell of this.cells.values()) {
      for (let i = 0; i < cell.length; i++) {
        fn(cell[i]);
      }
    }
  }
}
