import { AppRootStateType } from "app/store"

export const selectTodolist = (state: AppRootStateType) => state.todolists
export const selectTasks = (state: AppRootStateType) => state.tasks
