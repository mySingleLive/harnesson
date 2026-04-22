import { BrowserRouter, Routes, Route } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { NewSessionPage } from './pages/NewSessionPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SpecsPage } from './pages/SpecsPage';
import { TasksPage } from './pages/TasksPage';
import { FilesPage } from './pages/FilesPage';
import { GitPage } from './pages/GitPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<NewSessionPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="specs" element={<SpecsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="git" element={<GitPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
