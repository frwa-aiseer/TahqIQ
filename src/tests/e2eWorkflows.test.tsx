import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { createDemoProject, createEmptyProject } from '../data/demoProject';
import { DashboardView } from '../components/views/DashboardView';
import { ResearchCanvasView } from '../components/views/ResearchCanvasView';
import { SourceLibraryView } from '../components/views/SourceLibraryView';
import { WritingStudioView } from '../components/views/WritingStudioView';
import { ExportCentreView } from '../components/views/ExportCentreView';
import { ProjectWizardModal } from '../components/views/ProjectWizardModal';
import { AuthModal } from '../components/AuthModal';

describe('End-to-End Tests for Critical Workflows', () => {
  describe('1. Full Application Render & Header Verification', () => {
    it('renders prototype warning banner and header elements', () => {
      render(<App />);

      expect(screen.getByText(/Prototype environment — not approved for real research use/i)).toBeInTheDocument();
      expect(screen.getByText(/TehqIQ/i)).toBeInTheDocument();
    });

    it('renders pipeline navigation tabs and switches tabs', () => {
      render(<App />);

      const dashboardTab = screen.getByRole('button', { name: /Dashboard/i });
      expect(dashboardTab).toBeInTheDocument();
    });
  });

  describe('2. Component View Rendering Workflows', () => {
    it('renders DashboardView with readiness score and metrics', () => {
      const project = createDemoProject();
      render(
        <DashboardView
          project={project}
          onSelectStage={vi.fn()}
          onOpenWizard={vi.fn()}
          onOpenProjectManager={vi.fn()}
        />
      );

      expect(screen.getByText(/Readiness Score/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Architecture & Metadata/i)).toBeInTheDocument();
    });

    it('renders ResearchCanvasView and allows editing topic', () => {
      const project = createDemoProject();
      const onUpdateCanvas = vi.fn();

      render(
        <ResearchCanvasView
          canvas={project.canvas!}
          onUpdateCanvas={onUpdateCanvas}
          isDemoProject={project.isDemoProject}
        />
      );

      expect(screen.getByText(/Research Framework & Topic Blueprint/i)).toBeInTheDocument();
    });

    it('renders SourceLibraryView with search filter and add modal button', () => {
      const project = createDemoProject();

      render(
        <SourceLibraryView
          sources={project.sources}
          onAddSource={vi.fn()}
          onOpenReader={vi.fn()}
          isDemoProject={project.isDemoProject}
          activeCslStyle="apa-7th"
        />
      );

      expect(screen.getByText(/Literature Library & Citation Registry/i)).toBeInTheDocument();
    });

    it('renders WritingStudioView with manuscript sections and editor', () => {
      const project = createDemoProject();

      render(
        <WritingStudioView
          sections={project.sections}
          sources={project.sources}
          onUpdateSection={vi.fn()}
          activeOutlet={project.selectedTargetOutlet}
          activeCslStyle="apa-7th"
          isDemoProject={project.isDemoProject}
          project={project}
        />
      );

      expect(screen.getByText(/Evidence-Grounded Manuscript Assistant/i)).toBeInTheDocument();

    });

    it('renders ExportCentreView with export options and validation results', () => {
      const project = createDemoProject();

      render(
        <ExportCentreView
          project={project}
          activeCslStyle="apa-7th"
        />
      );

      expect(screen.getByText(/Calculated Manuscript Compliance Rules/i)).toBeInTheDocument();

    });
  });

  describe('3. Modal Workflows', () => {
    it('renders ProjectWizardModal and submits new project form', () => {
      const onCreateProject = vi.fn();
      const onClose = vi.fn();

      render(
        <ProjectWizardModal
          onClose={onClose}
          onCreateProject={onCreateProject}
        />
      );

      expect(screen.getByText(/Create New Research Project/i)).toBeInTheDocument();

      const titleInput = screen.getByPlaceholderText(/e.g. Investigation of Biomarker Trajectories/i);
      fireEvent.change(titleInput, { target: { value: 'New Test Project Title' } });

      const submitBtn = screen.getByRole('button', { name: /Initialize Project Workspace/i });
      fireEvent.click(submitBtn);


      expect(onCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Test Project Title'
        })
      );
    });

    it('renders AuthModal with sign in form', () => {
      render(
        <AuthModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/Sign In to TehqIQ/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/researcher@university.edu/i)).toBeInTheDocument();
    });
  });
});
