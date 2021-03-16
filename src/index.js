const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const AppError = require("./errors/AppError");

const app = express();

app.use(cors());
app.use(express.json());

// {
// 	id: 'uuid', // precisa ser um uuid
// 	name: 'Danilo Vieira',
// 	username: 'danilo',
// 	todos: []
// }
const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(400).json({ error: "User not found" });
  }

  request.user = user;
  return next();
}

function getUserTodo(user, idTodo) {
  const todo = user.todos.find((todo) => todo.id === idTodo);

  if (!todo) {
    throw new AppError("Todo not found", 404);
  }

  return todo;
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "User already exists. " });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/users", (request, response) => {
  return response.status(201).json(users);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(201).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id: idTodo } = request.params;

  const todo = getUserTodo(user, idTodo);

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.status(201).json(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id: idTodo } = request.params;

  const todo = getUserTodo(user, idTodo);

  todo.done = true;

  return response.status(201).json(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id: idTodo } = request.params;

  const todo = getUserTodo(user, idTodo);

  user.todos.splice(todo, 1);

  return response.status(204).send();
});

app.use((err, request, response, _next) => {
  if (err instanceof AppError) {
    return response.status(err.statusCode).json({
      error: err.message,
    });
  }

  return response.status(500).json({
    status: "Error",
    message: `Internal server error ${err.message}`,
  });
});

module.exports = app;
