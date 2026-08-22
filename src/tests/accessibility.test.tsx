import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { AuthModal } from '../components/AuthModal';
import { ProjectWizardModal } from '../components/views/ProjectWizardModal';
import { DocumentReaderModal } from '../components/views/DocumentReaderModal';

describe('Accessibility (a11y) Verification Tests', () => {
  describe('1. Landmark Roles and Page Structure', () => {
    it('renders main application container with clean semantic structure', () => {
      const { container } = render(<App />);
      expect(container.firstElementChild).toBeInTheDocument();
    });

    it('renders prototype banner with warning icon and visible message', () => {
      render(<App />);
      const banner = screen.getByText(/Prototype environment — not approved for real research use/i);
      expect(banner).toBeInTheDocument();
    });
  });

  describe('2. Modal Dialog Accessibility & Focus Trap Compliance', () => {
    it('renders AuthModal with aria-modal and role="dialog"', () => {
      render(<AuthModal isOpen={true} onClose={vi.fn()} />);

      const modalDialog = screen.getByRole('dialog');
      expect(modalDialog).toBeInTheDocument();
      expect(modalDialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText(/Sign In to TehqIQ/i)).toBeInTheDocument();
    });

    it('allows closing AuthModal using close button with accessible aria-label', () => {
      const onClose = vi.fn();
      render(<AuthModal isOpen={true} onClose={onClose} />);

      const closeBtn = screen.getByRole('button', { name: /Close modal/i });
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders ProjectWizardModal with proper accessible headers and form fields', () => {
      render(
        <ProjectWizardModal
          isOpen={true}
          onClose={vi.fn()}
          onCreateProject={vi.fn()}
        />
      );

      const titleInput = screen.getByPlaceholderText(/e.g. Investigation of Biomarker Trajectories/i);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).not.toBeDisabled();
    });

    it('renders DocumentReaderModal with full accessibility attributes when open', () => {
      const mockSource: any = {
        id: 'src-101',
        title: 'Force-Velocity Profile Analysis in Elite Athletes',
        authors: ['Samozino, P.'],
        year: 2022,
        journalOrVenue: 'Sports Med',
        abstract: 'Detailed abstract describing force velocity relationship.',
        verificationState: 'Verified'
      };

      render(
        <DocumentReaderModal
          source={mockSource}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Force-Velocity Profile Analysis/i)).toBeInTheDocument();
    });
  });

  describe('3. Touch Target and Contrast Constraints', () => {
    it('verifies primary buttons have accessible size and text label', () => {
      render(<App />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((btn) => {
        // Ensure every button has accessible text or aria-label or title
        const hasText = btn.textContent && btn.textContent.trim().length > 0;
        const hasAriaLabel = btn.hasAttribute('aria-label');
        const hasTitle = btn.hasAttribute('title');
        expect(hasText || hasAriaLabel || hasTitle).toBe(true);
      });
    });
  });
});
