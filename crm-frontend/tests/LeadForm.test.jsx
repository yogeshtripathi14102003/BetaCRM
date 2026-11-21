import { describe, expect, test, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import LeadForm from '@/features/leads/components/LeadForm';
import { renderWithProviders } from './utils';

describe('LeadForm', () => {
  test('khali submit: validation errors, onSubmit nahi chalta', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<LeadForm onSubmit={onSubmit} submitLabel="Create lead" />);
    fireEvent.click(screen.getByRole('button', { name: 'Create lead' }));

    expect(await screen.findByText('Naam kam se kam 2 characters ka ho')).toBeTruthy();
    expect(screen.getByText('Valid phone number daalo (10-15 digits)')).toBeTruthy();
    expect(screen.getByText('Source chuno')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('valid submit: phone normalize hokar onSubmit', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<LeadForm onSubmit={onSubmit} submitLabel="Create lead" />);
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Rahul Sharma' } });
    fireEvent.change(screen.getByLabelText('Phone *'), { target: { value: '+91 98765 43210' } });
    fireEvent.change(screen.getByLabelText('Source *'), { target: { value: 'website' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create lead' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Rahul Sharma', phone: '+919876543210', source: 'website' });
  });

  test('"Assign to" sirf lead.assign permission walo ko', async () => {
    renderWithProviders(<LeadForm onSubmit={vi.fn()} />, { permissions: ['lead.create'] });
    expect(screen.queryByLabelText('Assign to')).toBeNull();
  });
});
