/**
 * App component is the root component of the application.
 * It wraps the entire application with RefineProvider and RouterProvider.
 * It also contains the routes of the application.
 */
import { Authenticated, Refine } from "@refinedev/core"
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools"
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar"

import { useNotificationProvider } from "@refinedev/antd"
import "@refinedev/antd/dist/reset.css"

import { dataProvider, liveProvider } from "@refinedev/supabase"

import {
  ForgotPassword,
  Login,
  Register,
  ProjectList,
  ProjectEdit,
  TasksListPage,
} from "./pages"

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
} from "@refinedev/react-router-v6"
import { App as AntdApp } from "antd"
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom"
import Layout from "./components/layout"

import { ProjectCreate } from "./pages/project/create"

import { UserList } from "./pages/user/list"
import { CreateUser } from "./pages/user/create"
import { supabaseClient } from "./utilities/supabaseClient"
import { TasksEditPage } from "./pages/tasks/edit"
import { TasksCreatePage } from "./pages/tasks/create"
import { EditUser } from "./pages/user/edit"
import { DashboardPage } from "./pages/home"
import { SprintsListPage } from "./pages/sprint/list"
import MilestoneList from "./pages/milestones/list"

import ReportsPage from "./pages/reports"
import { resources } from "./config/resources"
import { accessControlProvider } from "./providers"
import { authProvider } from "./providers/data/authProvider"
import { TeamsPage } from "./pages/teams/list"

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <AntdApp>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider(supabaseClient)}
              liveProvider={liveProvider(supabaseClient)}
              notificationProvider={useNotificationProvider}
              routerProvider={routerBindings}
              authProvider={authProvider}
              resources={resources}
              accessControlProvider={accessControlProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
                projectId: "s7f9lj-Ej0vBG-2imUTw",
                liveMode: "auto",
              }}
            >
              <Routes>
                <Route path='/register' element={<Register />} />
                <Route path='/login' element={<Login />} />
                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route
                  element={
                    <Authenticated
                      key='authenticated-layout'
                      fallback={<CatchAllNavigate to='/login' />}
                    >
                      <Layout>
                        <Outlet />
                      </Layout>
                    </Authenticated>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path='/projects'>
                    <Route index element={<ProjectList />} />
                    <Route path='new' element={<ProjectCreate />} />
                    <Route path='edit/:id' element={<ProjectEdit />} />
                  </Route>
                  <Route
                    path='/tasks'
                    element={
                      <TasksListPage>
                        <Outlet />
                      </TasksListPage>
                    }
                  >
                    <Route path='new' element={<TasksCreatePage />} />
                    <Route path='edit/:id' element={<TasksEditPage />} />
                  </Route>
                  <Route path='/users'>
                    <Route index element={<UserList />} />
                    <Route path='new' element={<CreateUser />} />
                    <Route path='edit/:id' element={<EditUser />} />
                  </Route>
                  <Route path='/teams' element={<TeamsPage />} />
                  <Route path='/sprints' element={<SprintsListPage />} />
                  <Route path='/milestones' element={<MilestoneList />} />
                  <Route path='/reports' element={<ReportsPage />} />
                </Route>
              </Routes>

              <RefineKbar />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </AntdApp>
      </RefineKbarProvider>
    </BrowserRouter>
  )
}

export default App
