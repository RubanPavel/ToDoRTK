import { TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskArg, UpdateTaskModelType } from "api/todolists-api"

import { handleServerAppError, handleServerNetworkError } from "utils/error-utils"
import { appActions } from "app/app-reducer"
import { createSlice } from "@reduxjs/toolkit"
import { todolistThunks } from "features/TodolistsList/todolists-reducer"
import { createAppAsyncThunk } from "utils/createAppAsynkThunk"

const initialState: TasksStateType = {}

const slice = createSlice({
  name: "tasks",
  initialState: {} as TasksStateType,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state[action.payload.todolistId] = action.payload.tasks
      })
      .addCase(addTask.fulfilled, (state, action) => {
        const tasksForToDo = state[action.payload.task.todoListId]
        tasksForToDo.unshift(action.payload.task)
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const tasksForToDo = state[action.payload.todolistId]
        const index = tasksForToDo.findIndex((task) => task.id === action.payload.taskId)
        if (index !== -1) {
          tasksForToDo[index] = {
            ...tasksForToDo[index],
            ...action.payload.domainModel,
          }
        }
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        const tasksForToDo = state[action.payload.todolistId]
        const index = tasksForToDo.findIndex((todo) => todo.id === action.payload.taskId)
        if (index !== -1) {
          tasksForToDo.splice(index, 1)
        }
      })
      .addCase(todolistThunks.addTodolist.fulfilled, (state, action) => {
        state[action.payload.todolist.id] = []
      })
      .addCase(todolistThunks.removeTodolist.fulfilled, (state, action) => {
        delete state[action.payload.id]
      })
      .addCase(todolistThunks.fetchTodolists.fulfilled, (state, action) => {
        action.payload.todolists.forEach((tl) => {
          state[tl.id] = []
        })
      })
  },
})

// thunks

const fetchTasks = createAppAsyncThunk<
  {
    tasks: TaskType[]
    todolistId: string
  },
  string
>(`${slice.name}/fetchTasks`, async (todolistId: string, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI
  try {
    dispatch(appActions.setAppStatus({ status: "loading" }))
    const res = await todolistsAPI.getTasks(todolistId)
    const tasks = res.data.items
    dispatch(appActions.setAppStatus({ status: "succeeded" }))
    return { tasks, todolistId }
  } catch (error: any) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})

const addTask = createAppAsyncThunk<
  {
    task: TaskType
  },
  {
    todolistId: string
    title: string
  }
>(`${slice.name}/addTask`, async (arg, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI
  try {
    dispatch(appActions.setAppStatus({ status: "loading" }))
    const res = await todolistsAPI.createTask(arg.todolistId, arg.title)
    if (res.data.resultCode === ResultCode.succeeded) {
      dispatch(appActions.setAppStatus({ status: "succeeded" }))
      const task = res.data.data.item
      return { task }
    } else {
      handleServerNetworkError(res.data, dispatch)
      return rejectWithValue(null)
    }
  } catch (error: any) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})

/*export const _removeTaskTC =
  (taskId: string, todolistId: string): AppThunk =>
  (dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId).then((res) => {
      dispatch(tasksActions.removeTask({ taskId, todolistId }))
    })
  }*/
export type removeTaskType = {
  taskId: string
  todolistId: string
}
const removeTask = createAppAsyncThunk<removeTaskType, removeTaskType>(`${slice.name}/removeTask`, async (arg, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI
  try {
    dispatch(appActions.setAppStatus({ status: "loading" }))
    const res = await todolistsAPI.deleteTask(arg.todolistId, arg.taskId)
    if (res.data.resultCode === ResultCode.succeeded) {
      dispatch(appActions.setAppStatus({ status: "succeeded" }))
      return arg
    } else {
      handleServerNetworkError(res.data, dispatch)
      return rejectWithValue(null)
    }
  } catch (error: any) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})

const updateTask = createAppAsyncThunk<UpdateTaskArg, UpdateTaskArg>(`${slice.name}/updateTask`, async (arg, thunkAPI) => {
  const { dispatch, rejectWithValue, getState } = thunkAPI
  try {
    const state = getState()
    const task = state.tasks[arg.todolistId].find((t) => t.id === arg.taskId)
    if (!task) {
      //throw new Error("task not found in the state");
      console.warn("task not found in the state")
      return rejectWithValue(null)
    }

    const apiModel: UpdateTaskModelType = {
      deadline: task.deadline,
      description: task.description,
      priority: task.priority,
      startDate: task.startDate,
      title: task.title,
      status: task.status,
      ...arg.domainModel,
    }
    const res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel)
    if (res.data.resultCode === ResultCode.succeeded) {
      return arg
    } else {
      handleServerAppError(res.data, dispatch)
      return rejectWithValue(null)
    }
  } catch (error) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})

// types
export type UpdateDomainTaskModelType = {
  title?: string
  description?: string
  status?: TaskStatuses
  priority?: TaskPriorities
  startDate?: string
  deadline?: string
}
export type TasksStateType = {
  [key: string]: Array<TaskType>
}

export const tasksReducer = slice.reducer
export const tasksActions = slice.actions
export const tasksThunks = { fetchTasks, addTask, updateTask, removeTask }

export const ResultCode = {
  succeeded: 0,
  reject: 1,
  captcha: 10,
} as const
