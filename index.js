const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 14;
const cellsVertical = 10;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height,
    },
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }), Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }), Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }), Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })];
World.add(world, walls);

// Maze generation
const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
};

const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    // If I have visited the cell at [row, colum], then return
    if (grid[row][column]) {
        return;
    }
    // Mark this cell as being visited
    grid[row][column] = true;
    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left'],
    ]);

    // For each neighbor...
    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;

        // See if that neighbor is out of bounds
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        }

        // If we have visited that neighbor, continue the next neighbor
        if (grid[nextRow][nextColumn]) {
            continue;
        }

        // Remove a wall from either horizontals and verticals
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true;
        }

        stepThroughCell(nextRow, nextColumn);
    }
    // Visite that next cell
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(columnIndex * unitLengthX + unitLengthX / 2, rowIndex * unitLengthY + unitLengthY, unitLengthX, 5, {
            label: 'wall',
            isStatic: true,
            render: {
                fillStyle: 'DarkSalmon',
            },
        });
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(columnIndex * unitLengthX + unitLengthX, rowIndex * unitLengthY + unitLengthY / 2, 5, unitLengthY, {
            label: 'wall',
            isStatic: true,
            render: {
                fillStyle: 'DarkSalmon',
            },
        });
        World.add(world, wall);
    });
});

// Goal
const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX * 0.7, unitLengthY * 0.7, {
    label: 'goal',
    isStatic: true,
    render: {
        fillStyle: 'SpringGreen',
    },
});
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
    label: 'ball',
    render: {
        fillStyle: 'Coral',
    },
});
World.add(world, ball);

document.addEventListener('keydown', (event) => {
    const { x, y } = ball.velocity;
    const maxSpeed = 3;

    let newX = x;
    let newY = y;

    switch (event.key) {
        case 'w':
        case 'ArrowUp':
            newY = Math.max(y - 3, -maxSpeed);
            break;
        case 'd':
        case 'ArrowRight':
            newX = Math.min(x + 3, maxSpeed);
            break;
        case 's':
        case 'ArrowDown':
            newY = Math.min(y + 3, maxSpeed);
            break;
        case 'a':
        case 'ArrowLeft':
            newX = Math.max(x - 3, -maxSpeed);
            break;
    }

    Body.setVelocity(ball, { x: newX, y: newY });
});

// Win Condition
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((collision) => {
        const labels = ['ball', 'goal'];

        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach((body) => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            });
        }
    });
});
