import { todolistsAPI, TodolistType } from "api/todolists-api"
import { handleServerNetworkError } from "utils/error-utils"
import { AppThunk } from "app/store"
import { appActions, RequestStatusType } from "app/app-reducer"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { createAppAsyncThunk } from "utils/createAppAsynkThunk"
import { ResultCode } from "features/TodolistsList/tasks-reducer"

const slice = createSlice({
  name: "todolist",
  initialState: [] as TodolistDomainType[],
  reducers: {
    changeTodolistTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
      // 1var
      const index = state.findIndex((todo) => todo.id === action.payload.id)
      if (index !== -1) {
        state[index].title = action.payload.title
      }
      /*//2var
      const todolist = state.find((todo) => todo.id === action.payload.id)
      if (todolist) {
        todolist.title = action.payload.title
      }*/
    },
    changeTodolistFilter: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
      const todolist = state.find((todo) => todo.id === action.payload.id)
      if (todolist) {
        todolist.filter = action.payload.filter
      }
    },
    changeTodolistEntityStatus: (state, action: PayloadAction<{ id: string; entityStatus: RequestStatusType }>) => {
      const todolist = state.find((todo) => todo.id === action.payload.id)
      if (todolist) {
        todolist.entityStatus = action.payload.entityStatus
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodolists.fulfilled, (state, action) => {
        return action.payload.todolists.map((tl) => ({ ...tl, filter: "all", entityStatus: "idle" }))
      })
      .addCase(removeTodolist.fulfilled, (state, action) => {
        const todo = state.findIndex((todo) => todo.id === action.payload.id)
        if (todo !== -1) {
          state.splice(todo, 1)
        }
      })
      .addCase(addTodolist.fulfilled, (state, action) => {
        state.unshift({ ...action.payload.todolist, filter: "all", entityStatus: "idle" })
      })
  },
})

// actions

// thunks

const fetchTodolists = createAppAsyncThunk<{ todolists: TodolistType[] }, void>(`${slice.name}/fetchTodolists`, async (arg, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI
  try {
    dispatch(appActions.setAppStatus({ status: "loading" }))
    const res = await todolistsAPI.getTodolists()
    dispatch(appActions.setAppStatus({ status: "succeeded" }))
    return { todolists: res.data }
  } catch (error: any) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})

const removeTodolist = createAppAsyncThunk<
  {
    id: string
  },
  string
>(`${slice.name}/removeTodolist`, async (todolistId, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI
  try {
    dispatch(appActions.setAppStatus({ status: "loading" }))
    dispatch(todolistsActions.changeTodolistEntityStatus({ id: todolistId, entityStatus: "loading" }))
    const res = await todolistsAPI.deleteTodolist(todolistId)
    if (res.data.resultCode === ResultCode.succeeded) {
      dispatch(appActions.setAppStatus({ status: "succeeded" }))
      return { id: todolistId }
    } else {
      handleServerNetworkError(res.data, dispatch)
      return rejectWithValue(null)
    }
  } catch (error: any) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})

const addTodolist = createAppAsyncThunk<
  {
    todolist: TodolistType
  },
  string
>(`${slice.name}/addTodolist`, async (title, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI
  dispatch(appActions.setAppStatus({ status: "loading" }))
  try {
    const res = await todolistsAPI.createTodolist(title)
    if (res.data.resultCode === ResultCode.succeeded) {
      dispatch(appActions.setAppStatus({ status: "succeeded" }))
      return { todolist: res.data.data.item }
    } else {
      handleServerNetworkError(res.data, dispatch)
      return rejectWithValue(null)
    }
  } catch (error: any) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})

export const _changeTodolistTitleTC = (id: string, title: string): AppThunk => {
  return (dispatch) => {
    todolistsAPI.updateTodolist(id, title).then((res) => {})
  }
}
type changeTodolistTitleType = {
  id: string
  title: string
}

const changeTodolistTitle = createAppAsyncThunk<changeTodolistTitleType, changeTodolistTitleType>(`${slice.name}/changeTodolistTitle`, async ({ id, title }, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI
  dispatch(appActions.setAppStatus({ status: "loading" }))
  try {
    const res = await todolistsAPI.updateTodolist(id, title)
    if (res.data.resultCode === ResultCode.succeeded) {
      dispatch(appActions.setAppStatus({ status: "succeeded" }))
      return { id, title }
    } else {
      handleServerNetworkError(res.data, dispatch)
      return rejectWithValue(null)
    }
  } catch (error: any) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})

// types

export type FilterValuesType = "all" | "active" | "completed"
export type TodolistDomainType = TodolistType & {
  filter: FilterValuesType
  entityStatus: RequestStatusType
}

export const todolistsReducer = slice.reducer
export const todolistsActions = slice.actions
export const todolistThunks = { fetchTodolists, removeTodolist, addTodolist, changeTodolistTitle }
