import {useState, useEffect} from 'react';
import TodoList from './features/TodoList/TodoList.jsx'
import TodoForm from './features/TodoForm.jsx'
import './App.css';

function App() 
{
  const [todoList, setTodoList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const url = `https://api.airtable.com/v0/${import.meta.env.VITE_BASE_ID}/${import.meta.env.VITE_TABLE_NAME}`;
  const token = `Bearer ${import.meta.env.VITE_PAT}`;

  useEffect(() => 
  {
    const fetchTodos = async () => 
    {
      setIsLoading(true);

      const options = 
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      };

      try 
      {
        const resp = await fetch(url, options);

        if (!resp.ok) 
        {
          throw new Error(resp.message);
        }

        const { records } = await resp.json();

        const fetchedTodos = records.map((record) => 
        {
          const todo = 
          {
            id: record.id,
            ...record.fields,
          };

          if (!todo.isCompleted) 
          {
            todo.isCompleted = false;
          }
          
          return todo;
        });

        setTodoList(fetchedTodos);
      } 
      catch (error) 
      {
        setErrorMessage(error.message);
      } 
      finally 
      {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, []);

const addTodo = async (newTodo) => 
{
  const payload = 
  {
    records: [
      {
        fields: {
          title: newTodo.title,
          isCompleted: newTodo.isCompleted,
        },
      },
    ],
  };
  const options = 
  {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  try 
  {
    setIsSaving(true);

    const resp = await fetch(url, options);

    if (!resp.ok) 
    {
      throw new Error(resp.message);
    }

    const { records } = await resp.json();

    const savedTodo = 
    {
      id: records[0].id,
      ...records[0].fields,
    };

    if (!savedTodo.isCompleted) 
    {
      savedTodo.isCompleted = false;
    }

    setTodoList([...todoList, savedTodo]);
  } 
  catch (error) 
  {
    console.error(error);
    setErrorMessage(error.message);
  } 
  finally 
  {
    setIsSaving(false);
  }
};

const completeTodo = async (id) => 
{
  const originalTodo = todoList.find((todo) => todo.id === id);

  const updatedTodo = 
  {
    ...originalTodo,
    isCompleted: !originalTodo.isCompleted,
  };

  const updatedTodos = todoList.map((todo) =>
    todo.id === id ? updatedTodo : todo);
  setTodoList(updatedTodos);

  const payload = 
  {
    records: [
      {
        id: updatedTodo.id,
        fields: 
        {
          title: updatedTodo.title,
          isCompleted: updatedTodo.isCompleted,
        },
      },
    ],
  };

  const options = 
  {
    method: "PATCH",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  try 
  {
    const resp = await fetch(url, options);

    if (!resp.ok) 
    {
      throw new Error("Failed to complete todo");
    }
  } 
  catch (error) 
  {
    console.error(error);
    setErrorMessage(`${error.message}. Reverting todo...`);

    const revertedTodos = todoList.map((todo) =>
      todo.id === originalTodo.id ? originalTodo : todo
    );
    setTodoList(revertedTodos);
  }
};

const updateTodo = async (editedTodo) => 
{
  const originalTodo = todoList.find(
    (todo) => todo.id === editedTodo.id
  );

  const updatedTodos = todoList.map((todo) =>
    todo.id === editedTodo.id ? editedTodo : todo
  );
  setTodoList(updatedTodos);

  const payload = 
  {
    records: [
      {
        id: editedTodo.id,
        fields: {
          title: editedTodo.title,
          isCompleted: editedTodo.isCompleted,
        },
      },
    ],
  };

  const options = 
  {
    method: "PATCH",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  try 
  {
    setIsSaving(true);

    const resp = await fetch(url, options);

    if (!resp.ok) {
      throw new Error("Failed to update todo");
    }
  } 
  catch (error) 
  {
    console.error(error);
    setErrorMessage(`${error.message}. Reverting todo...`);

    const revertedTodos = todoList.map((todo) =>
      todo.id === originalTodo.id ? originalTodo : todo
    );
    setTodoList(revertedTodos);
  } 
  finally 
  {
    setIsSaving(false);
  }
};


  return (
    <div>
      <h1>Todo List</h1>
      <TodoForm onAddTodo={addTodo} isSaving={isSaving} />
      <TodoList
        todoList={todoList}
        onCompleteTodo={completeTodo}
        onUpdateTodo={updateTodo}
        isLoading={isLoading}
      />
      {errorMessage && (
      <div>
        <hr />
        <p>{errorMessage}</p>
        <button onClick={() => setErrorMessage("")}>
          Dismiss
        </button>
      </div>)}
    </div>
  );
}

export default App;
