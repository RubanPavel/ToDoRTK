import React, { useCallback, useEffect } from "react"
import { useSelector } from "react-redux"
import { FilterValuesType, todolistsActions, todolistThunks } from "./todolists-reducer"
import { tasksThunks } from "./tasks-reducer"
import { TaskStatuses } from "api/todolists-api"
import { Grid, Paper } from "@mui/material"
import { AddItemForm } from "components/AddItemForm/AddItemForm"
import { Todolist } from "./Todolist/Todolist"
import { Navigate } from "react-router-dom"
import { useAppDispatch } from "hooks/useAppDispatch"
import { selectTasks, selectTodolist } from "features/TodolistsList/Todolist/todo-selectors"
import { selectIsLoggedIn } from "features/Login/auth-selectors"

type PropsType = {
  demo?: boolean
}

export const TodolistsList: React.FC<PropsType> = ({ demo = false }) => {
  const todolists = useSelector(selectTodolist)
  const tasks = useSelector(selectTasks)
  const isLoggedIn = useSelector(selectIsLoggedIn)

  const dispatch = useAppDispatch()

  useEffect(() => {
    if (demo || !isLoggedIn) {
      return
    }
    dispatch(todolistThunks.fetchTodolists)
  }, [])

  const removeTask = useCallback(function (id: string, todolistId: string) {
    const thunk = tasksThunks.removeTask({ taskId: id, todolistId })
    dispatch(thunk)
  }, [])

  const addTask = useCallback(function (title: string, todolistId: string) {
    dispatch(tasksThunks.addTask({ title, todolistId }))
  }, [])

  const changeStatus = useCallback(function (id: string, status: TaskStatuses, todolistId: string) {
    dispatch(tasksThunks.updateTask({ taskId: id, domainModel: { status }, todolistId }))
  }, [])

  const changeTaskTitle = useCallback(function (id: string, newTitle: string, todolistId: string) {
    dispatch(tasksThunks.updateTask({ taskId: id, domainModel: { title: newTitle }, todolistId }))
  }, [])

  const changeFilter = useCallback(function (filter: FilterValuesType, id: string) {
    dispatch(todolistsActions.changeTodolistFilter({ id, filter }))
  }, [])

  const removeTodolist = useCallback(function (id: string) {
    dispatch(todolistThunks.removeTodolist(id))
  }, [])

  const changeTodolistTitle = useCallback(function (id: string, title: string) {
    dispatch(todolistThunks.changeTodolistTitle({ id, title }))
  }, [])

  const addTodolist = useCallback(
    (title: string) => {
      dispatch(todolistThunks.addTodolist(title))
    },
    [dispatch],
  )

  if (!isLoggedIn) {
    return <Navigate to={"/login"} />
  }

  return (
    <>
      <Grid container style={{ padding: "20px" }}>
        <AddItemForm addItem={addTodolist} />
      </Grid>
      <Grid container spacing={3}>
        {todolists.map((tl) => {
          let allTodolistTasks = tasks[tl.id]

          return (
            <Grid item key={tl.id}>
              <Paper style={{ padding: "10px" }}>
                <Todolist
                  todolist={tl}
                  tasks={allTodolistTasks}
                  removeTask={removeTask}
                  changeFilter={changeFilter}
                  addTask={addTask}
                  changeTaskStatus={changeStatus}
                  removeTodolist={removeTodolist}
                  changeTaskTitle={changeTaskTitle}
                  changeTodolistTitle={changeTodolistTitle}
                  demo={demo}
                />
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </>
  )
}
