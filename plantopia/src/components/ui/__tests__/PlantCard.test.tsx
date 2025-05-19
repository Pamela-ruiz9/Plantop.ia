'use client';

import { render, screen, fireEvent } from '@testing-library/react';
import { PlantCard } from '../PlantCard';
import userEvent from '@testing-library/user-event';
import { useToast } from '@/lib/contexts/ToastContext';

jest.mock('@/lib/contexts/ToastContext');

describe('PlantCard', () => {
  const mockPlant = {
    id: 'plant-1',
    userId: 'user-1',
    commonName: 'Snake Plant',
    species: 'Sansevieria trifasciata',
    location: 'indoor',
    healthStatus: 'healthy',
    notes: 'By the window',
    wateringSchedule: {
      frequency: 7,
      lastWatered: new Date('2025-05-01'),
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockShowToast = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnWater = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  it('displays plant information correctly', () => {
    render(
      <PlantCard
        plant={mockPlant}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onWater={mockOnWater}
      />
    );

    expect(screen.getByText(mockPlant.commonName)).toBeInTheDocument();
    expect(screen.getByText(mockPlant.species)).toBeInTheDocument();
    expect(screen.getByText(/indoor/i)).toBeInTheDocument();
    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
  });

  it('shows watering schedule information', () => {
    render(
      <PlantCard
        plant={mockPlant}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onWater={mockOnWater}
      />
    );

    expect(screen.getByText(/every 7 days/i)).toBeInTheDocument();
    expect(screen.getByText(/last watered/i)).toBeInTheDocument();
  });

  it('calls onWater when water button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PlantCard
        plant={mockPlant}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onWater={mockOnWater}
      />
    );

    const waterButton = screen.getByRole('button', { name: /water now/i });
    await user.click(waterButton);

    expect(mockOnWater).toHaveBeenCalledWith(mockPlant.id);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Updated watering schedule for Snake Plant',
      'success'
    );
  });

  it('calls onDelete when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);

    render(
      <PlantCard
        plant={mockPlant}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onWater={mockOnWater}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledWith(mockPlant.id);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Deleted Snake Plant',
      'success'
    );
  });

  it('does not call onDelete when delete is cancelled', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);

    render(
      <PlantCard
        plant={mockPlant}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onWater={mockOnWater}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('calls onUpdate when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PlantCard
        plant={mockPlant}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onWater={mockOnWater}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(mockOnUpdate).toHaveBeenCalledWith(mockPlant);
  });

  it('shows warning when plant needs water', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const needsWaterPlant = {
      ...mockPlant,
      wateringSchedule: {
        frequency: 7,
        lastWatered: pastDate,
      },
    };

    render(
      <PlantCard
        plant={needsWaterPlant}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onWater={mockOnWater}
      />
    );

    expect(screen.getByText(/needs water/i)).toBeInTheDocument();
  });

  it('handles errors during actions gracefully', async () => {
    const user = userEvent.setup();
    const error = new Error('Failed to water plant');
    mockOnWater.mockRejectedValueOnce(error);

    render(
      <PlantCard
        plant={mockPlant}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onWater={mockOnWater}
      />
    );

    const waterButton = screen.getByRole('button', { name: /water now/i });
    await user.click(waterButton);

    expect(mockShowToast).toHaveBeenCalledWith(
      'Error updating watering schedule: Failed to water plant',
      'error'
    );
  });
});
