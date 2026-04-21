import { BrowserRouter, Routes, Route } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SpecsPage } from './pages/SpecsPage';
import { TasksPage } from './pages/TasksPage';
import { GitPage } from './pages/GitPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="specs" element={<SpecsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="git" element={<GitPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
