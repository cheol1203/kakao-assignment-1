const todoInput = document.querySelector("#todoInput");
const addTodoButton = document.querySelector("#addTodoButton");
const messageText = document.querySelector("#messageText");
const todoList = document.querySelector("#todoList");
const filterTabs = document.querySelectorAll(".filter-tab");

const previousDateButton = document.querySelector("#previousDateButton");
const nextDateButton = document.querySelector("#nextDateButton");
const selectedDateText = document.querySelector("#selectedDateText");

// 로컬스토리지에 Todo 데이터를 저장할 때 사용할 key 이름입니다.
const TODO_STORAGE_KEY = "vanillaTodoItems";

let todoItems = [];
let nextTodoId = 1;

let currentFilter = "all";
let selectedDate = new Date();

// Date 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 화면에 표시할 날짜 문구를 만듭니다.
function formatDateText(date) {
  const dateKey = formatDateKey(date);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[date.getDay()];

  return `${dateKey} (${dayName})`;
}

// Todo 배열을 로컬스토리지에 저장합니다.
function saveTodoItemsToLocalStorage() {
  // 객체나 배열은 그대로 저장할 수 없기 때문에 JSON 문자열로 변환해서 저장합니다.
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoItems));
}

// 로컬스토리지에서 Todo 배열을 불러옵니다.
function loadTodoItemsFromLocalStorage() {
  const savedTodoItems = localStorage.getItem(TODO_STORAGE_KEY);

  // 저장된 데이터가 없으면 빈 배열 상태를 유지합니다.
  if (savedTodoItems === null) {
    todoItems = [];
    nextTodoId = 1;
    return;
  }

  // JSON 문자열을 다시 JavaScript 배열로 변환합니다.
  todoItems = JSON.parse(savedTodoItems);

  // 새 Todo의 id가 기존 Todo와 겹치지 않도록 가장 큰 id보다 1 큰 값으로 설정합니다.
  if (todoItems.length > 0) {
    const todoIds = todoItems.map(function (todoItem) {
      return todoItem.id;
    });

    nextTodoId = Math.max(...todoIds) + 1;
  } else {
    nextTodoId = 1;
  }
}

// 상단 날짜 텍스트를 갱신합니다.
function renderSelectedDate() {
  selectedDateText.textContent = formatDateText(selectedDate);
}

// 날짜를 하루씩 이동하는 함수입니다.
function moveSelectedDate(dayAmount) {
  selectedDate.setDate(selectedDate.getDate() + dayAmount);

  clearMessage();
  renderSelectedDate();
  renderTodoList();
}

// 현재 날짜와 필터 상태에 맞는 Todo 목록만 반환합니다.
function getFilteredTodoItems() {
  const selectedDateKey = formatDateKey(selectedDate);

  let filteredTodoItems = todoItems.filter(function (todoItem) {
    return todoItem.date === selectedDateKey;
  });

  if (currentFilter === "active") {
    filteredTodoItems = filteredTodoItems.filter(function (todoItem) {
      return todoItem.isCompleted === false;
    });
  }

  if (currentFilter === "completed") {
    filteredTodoItems = filteredTodoItems.filter(function (todoItem) {
      return todoItem.isCompleted === true;
    });
  }

  return filteredTodoItems;
}

function getEmptyMessage() {
  if (currentFilter === "active") {
    return "이 날짜에 진행 중인 Todo가 없습니다.";
  }

  if (currentFilter === "completed") {
    return "이 날짜에 완료된 Todo가 없습니다.";
  }

  return "이 날짜에 등록된 Todo가 없습니다.";
}

function renderTodoList() {
  todoList.innerHTML = "";

  const filteredTodoItems = getFilteredTodoItems();

  if (filteredTodoItems.length === 0) {
    const emptyMessageItem = document.createElement("li");
    emptyMessageItem.className = "empty-message";
    emptyMessageItem.textContent = getEmptyMessage();

    todoList.appendChild(emptyMessageItem);
    return;
  }

  filteredTodoItems.forEach(function (todoItem) {
    const todoListItem = document.createElement("li");
    todoListItem.className = "todo-item";

    const todoText = document.createElement("span");
    todoText.className = "todo-text";
    todoText.textContent = todoItem.text;

    if (todoItem.isCompleted) {
      todoText.classList.add("completed");
    }

    const todoActions = document.createElement("div");
    todoActions.className = "todo-actions";

    const editButton = document.createElement("button");
    editButton.className = "todo-action-button edit-button";
    editButton.textContent = "수정";
    editButton.addEventListener("click", function () {
      editTodo(todoItem.id);
    });

    const completeButton = document.createElement("button");
    completeButton.className = "todo-action-button complete-button";
    completeButton.textContent = todoItem.isCompleted ? "취소" : "완료";
    completeButton.addEventListener("click", function () {
      toggleTodoComplete(todoItem.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "todo-action-button delete-button";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", function () {
      deleteTodo(todoItem.id);
    });

    todoActions.appendChild(editButton);
    todoActions.appendChild(completeButton);
    todoActions.appendChild(deleteButton);

    todoListItem.appendChild(todoText);
    todoListItem.appendChild(todoActions);

    todoList.appendChild(todoListItem);
  });
}

function updateFilterTabStyle() {
  filterTabs.forEach(function (filterTab) {
    const filterType = filterTab.dataset.filter;

    if (filterType === currentFilter) {
      filterTab.classList.add("active");
    } else {
      filterTab.classList.remove("active");
    }
  });
}

function showMessage(message) {
  messageText.textContent = message;
}

function clearMessage() {
  messageText.textContent = "";
}

function addTodo() {
  const todoText = todoInput.value.trim();

  if (todoText === "") {
    showMessage("할 일을 입력한 후 추가 버튼을 눌러주세요.");
    return;
  }

  const newTodoItem = {
    id: nextTodoId,
    text: todoText,
    isCompleted: false,

    // Todo 생성 시 현재 선택된 날짜를 함께 저장합니다.
    date: formatDateKey(selectedDate),
  };

  todoItems.push(newTodoItem);
  nextTodoId += 1;

  // Todo가 추가될 때마다 로컬스토리지에 저장합니다.
  saveTodoItemsToLocalStorage();

  todoInput.value = "";
  clearMessage();
  renderTodoList();
}

function editTodo(todoId) {
  const selectedTodo = todoItems.find(function (todoItem) {
    return todoItem.id === todoId;
  });

  if (!selectedTodo) {
    return;
  }

  const editedTodoText = prompt("수정할 내용을 입력하세요.", selectedTodo.text);

  if (editedTodoText === null) {
    return;
  }

  const trimmedTodoText = editedTodoText.trim();

  if (trimmedTodoText === "") {
    showMessage("수정할 내용은 비워둘 수 없습니다.");
    return;
  }

  selectedTodo.text = trimmedTodoText;

  // Todo가 수정될 때마다 로컬스토리지에 저장합니다.
  saveTodoItemsToLocalStorage();

  clearMessage();
  renderTodoList();
}

function toggleTodoComplete(todoId) {
  const selectedTodo = todoItems.find(function (todoItem) {
    return todoItem.id === todoId;
  });

  if (!selectedTodo) {
    return;
  }

  selectedTodo.isCompleted = !selectedTodo.isCompleted;

  // Todo 완료 상태가 바뀔 때마다 로컬스토리지에 저장합니다.
  saveTodoItemsToLocalStorage();

  clearMessage();
  renderTodoList();
}

function deleteTodo(todoId) {
  todoItems = todoItems.filter(function (todoItem) {
    return todoItem.id !== todoId;
  });

  // Todo가 삭제될 때마다 로컬스토리지에 저장합니다.
  saveTodoItemsToLocalStorage();

  clearMessage();
  renderTodoList();
}

filterTabs.forEach(function (filterTab) {
  filterTab.addEventListener("click", function () {
    currentFilter = filterTab.dataset.filter;

    clearMessage();
    updateFilterTabStyle();
    renderTodoList();
  });
});

addTodoButton.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTodo();
  }
});

previousDateButton.addEventListener("click", function () {
  moveSelectedDate(-1);
});

nextDateButton.addEventListener("click", function () {
  moveSelectedDate(1);
});

// 페이지가 처음 열릴 때 로컬스토리지에서 Todo 데이터를 불러옵니다.
loadTodoItemsFromLocalStorage();

updateFilterTabStyle();
renderSelectedDate();
renderTodoList();