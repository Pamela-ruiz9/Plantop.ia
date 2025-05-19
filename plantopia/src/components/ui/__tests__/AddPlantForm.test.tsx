'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddPlantForm } from '../AddPlantForm';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { useRouter } from 'next/navigation';

// Mock the hooks
jest.mock('@/lib/contexts/AuthContext');
jest.mock('@/lib/contexts/ToastContext');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('AddPlantForm', () => {
  const mockUser = { uid: 'test-uid', email: 'test@example.com' };
  const mockShowToast = jest.fn();
  const mockPush = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AuthContext
    (useAuthContext as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    // Mock ToastContext
    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders the form with empty fields', () => {
    render(
      <AddPlantForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Verify all form fields are present
    expect(screen.getByLabelText(/common name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/species/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/health status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/watering frequency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('redirects to login if user is not authenticated', () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <AddPlantForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('submits form with correct data', async () => {
    render(
      <AddPlantForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/common name/i), {
      target: { value: 'Snake Plant' },
    });
    fireEvent.change(screen.getByLabelText(/species/i), {
      target: { value: 'Sansevieria trifasciata' },
    });
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'indoor' },
    });
    fireEvent.change(screen.getByLabelText(/health status/i), {
      target: { value: 'healthy' },
    });
    fireEvent.change(screen.getByLabelText(/watering frequency/i), {
      target: { value: '14' },
    });
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'By the window' },
    });

    // Submit the form
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          commonName: 'Snake Plant',
          species: 'Sansevieria trifasciata',
          location: 'indoor',
          healthStatus: 'healthy',
          notes: 'By the window',
          wateringSchedule: {
            frequency: 14,
            lastWatered: expect.any(Date),
          },
        }),
        undefined
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      'Successfully added Snake Plant',
      'success'
    );
  });

  it('validates required fields', async () => {
    render(
      <AddPlantForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Submit without filling required fields
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText(/common name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles file upload', async () => {
    render(
      <AddPlantForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/photo/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.change(screen.getByLabelText(/common name/i), {
      target: { value: 'Snake Plant' },
    });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.any(Object),
        file
      );
    });
  });

  it('loads initial data correctly', () => {
    const initialData = {
      id: '1',
      userId: 'user1',
      commonName: 'Existing Plant',
      species: 'Existing Species',
      location: 'indoor' as const,
      healthStatus: 'healthy' as const,
      notes: 'Existing notes',
      wateringSchedule: {
        frequency: 10,
        lastWatered: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(
      <AddPlantForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={initialData}
      />
    );

    expect(screen.getByLabelText(/common name/i)).toHaveValue('Existing Plant');
    expect(screen.getByLabelText(/species/i)).toHaveValue('Existing Species');
    expect(screen.getByLabelText(/location/i)).toHaveValue('indoor');
    expect(screen.getByLabelText(/health status/i)).toHaveValue('healthy');
    expect(screen.getByLabelText(/notes/i)).toHaveValue('Existing notes');
    expect(screen.getByLabelText(/watering frequency/i)).toHaveValue('10');
  });

  it('handles cancel button click', () => {
    render(
      <AddPlantForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText(/cancel/i));

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
