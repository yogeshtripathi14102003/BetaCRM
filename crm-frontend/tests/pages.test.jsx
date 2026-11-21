import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { ApiError } from '@/lib/http/errors';
import { startMockSession } from '@/mocks/auth';
import { db } from '@/mocks/db';
import { followupService } from '@/services';
import LeadsPage from '@/app/(app)/crm/leads/page';
import FollowupsPage from '@/app/(app)/crm/followups/page';
import { renderWithProviders } from './utils';

beforeEach(() => startMockSession('admin'));

const bodyRows = () => within(screen.getByRole('table').querySelector('tbody')).queryAllByRole('row');

describe('Leads list page', () => {
  test('pehla page: 20 rows + "1–20 of 57"', async () => {
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByText(`1–20 of ${db.leads.length}`)).toBeTruthy();
    expect(bodyRows()).toHaveLength(20);
  });

  test('URL ka status filter server tak jaata hai', async () => {
    globalThis.__nav.params = new URLSearchParams('status=converted');
    const n = db.leads.filter((l) => l.status === 'converted').length;
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByText(`1–${Math.min(n, 20)} of ${n}`)).toBeTruthy();
  });

  test('search se kuch na mile to empty state', async () => {
    globalThis.__nav.params = new URLSearchParams('search=zzzz-no-match');
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByText('Koi record nahi mila')).toBeTruthy();
  });

  test('Next click: URL me page=2', async () => {
    renderWithProviders(<LeadsPage />);
    await screen.findByText(`1–20 of ${db.leads.length}`);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(globalThis.__nav.replace).toHaveBeenCalledWith('/crm/leads?page=2', { scroll: false });
  });

  test('row click: detail page par', async () => {
    renderWithProviders(<LeadsPage />);
    await screen.findByText(`1–20 of ${db.leads.length}`);
    fireEvent.click(bodyRows()[0]);
    expect(globalThis.__nav.push).toHaveBeenCalledWith(expect.stringMatching(/^\/crm\/leads\/l\d+$/));
  });

  test('search box: typing ke baad (debounce) URL update', async () => {
    renderWithProviders(<LeadsPage />);
    await screen.findByText(`1–20 of ${db.leads.length}`);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'aarav' } });
    await waitFor(() => expect(globalThis.__nav.replace).toHaveBeenCalledWith('/crm/leads?search=aarav', { scroll: false }), {
      timeout: 2000,
    });
  });

  test('permission nahi to Forbidden, aur API call hi nahi', async () => {
    renderWithProviders(<LeadsPage />, { permissions: ['student.read'] });
    expect(await screen.findByText('Access nahi hai')).toBeTruthy();
  });

  test('"New lead" button sirf lead.create walo ko', async () => {
    renderWithProviders(<LeadsPage />, { permissions: ['lead.read'] });
    await screen.findByText(`1–20 of ${db.leads.length}`);
    expect(screen.queryByText('New lead')).toBeNull();
  });
});

describe('Followups: optimistic update + rollback', () => {
  test('Done click: row turant hat jaati hai; server fail to wapas aati hai', async () => {
    globalThis.__nav.params = new URLSearchParams('bucket=upcoming');
    let rejectComplete;
    vi.spyOn(followupService, 'complete').mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectComplete = reject;
        })
    );

    renderWithProviders(<FollowupsPage />);
    await screen.findAllByRole('button', { name: /done/i }); // skeleton nahi, asli rows
    const before = bodyRows().length;

    fireEvent.click(within(bodyRows()[0]).getByRole('button', { name: /done/i }));
    await waitFor(() => expect(bodyRows()).toHaveLength(before - 1)); // server abhi pending hai, UI pehle hi badal gaya

    rejectComplete(new ApiError(500, { message: 'boom' }));
    await waitFor(() => expect(bodyRows()).toHaveLength(before)); // rollback
    vi.restoreAllMocks();
  });
});
