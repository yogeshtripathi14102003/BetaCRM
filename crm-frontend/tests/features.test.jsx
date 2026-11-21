import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ApiError } from '@/lib/http/errors';
import { startMockSession } from '@/mocks/auth';
import { db } from '@/mocks/db';
import { leadService } from '@/services';
import { buildCrumbs } from '@/components/layout/Breadcrumbs';
import CommandPalette from '@/components/layout/CommandPalette';
import ThemeToggle from '@/components/layout/ThemeToggle';
import ThemeProvider from '@/providers/ThemeProvider';
import LeadsBoard from '@/features/leads/components/LeadsBoard';
import LeadsPage from '@/app/(app)/crm/leads/page';
import DashboardPage from '@/app/(app)/dashboard/page';
import { blobText } from './blob';
import { renderWithProviders } from './utils';

vi.mock('@/lib/download', () => ({ saveBlob: vi.fn() }));
import { saveBlob } from '@/lib/download';

beforeEach(() => {
  startMockSession('admin');
  saveBlob.mockClear();
});

describe('Kanban board', () => {
  const column = (name) => screen.getByRole('region', { name: `${name} column` });

  test('7 columns, har column me us status ke cards', async () => {
    renderWithProviders(<LeadsBoard filters={{}} />);
    const cards = await within(column('New')).findAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);
    for (const s of ['New', 'Contacted', 'Interested', 'Follow up', 'Application', 'Converted', 'Lost']) expect(column(s)).toBeTruthy();
  });

  test('card ko move karo: UI turant badalti hai (optimistic); server fail to rollback', async () => {
    let rejectMove;
    vi.spyOn(leadService, 'setStatus').mockImplementation(
      () =>
        new Promise((_, rej) => {
          rejectMove = rej;
        })
    );
    renderWithProviders(<LeadsBoard filters={{}} />);

    const card = (await within(column('New')).findAllByRole('article'))[0];
    const name = within(card).getByRole('link').textContent;
    await within(column('Lost'))
      .findAllByRole('article')
      .catch(() => null); // Lost column load ho jaye

    fireEvent.change(within(card).getByLabelText(`Move ${name}`), { target: { value: 'lost' } });
    await waitFor(() => expect(within(column('Lost')).getByText(name)).toBeTruthy()); // server abhi pending hai
    expect(within(column('New')).queryByText(name)).toBeNull();

    rejectMove(new ApiError(500, { message: 'boom' }));
    await waitFor(() => expect(within(column('New')).getByText(name)).toBeTruthy()); // rollback
    vi.restoreAllMocks();
  });

  test('move sahi chalta hai to DB me status badalta hai', async () => {
    renderWithProviders(<LeadsBoard filters={{}} />);
    const card = (await within(column('New')).findAllByRole('article'))[0];
    const name = within(card).getByRole('link').textContent;
    fireEvent.change(within(card).getByLabelText(`Move ${name}`), { target: { value: 'converted' } });
    await waitFor(() => expect(db.leads.find((l) => l.name === name).status).toBe('converted'));
  });

  test('lead.update permission nahi to cards draggable/move nahi', async () => {
    renderWithProviders(<LeadsBoard filters={{}} />, { permissions: ['lead.read'] });
    const card = (await within(column('New')).findAllByRole('article'))[0];
    expect(card.getAttribute('draggable')).toBe('false');
    expect(within(card).queryByLabelText(/^Move /)).toBeNull();
  });

  test('search/source filter columns tak jaata hai', async () => {
    renderWithProviders(<LeadsBoard filters={{ source: 'referral' }} />);
    await waitFor(() =>
      expect(
        within(column('New')).queryAllByRole('article').length + within(column('Contacted')).queryAllByRole('article').length
      ).toBeGreaterThanOrEqual(0)
    );
    const expected = db.leads.filter((l) => l.status === 'converted' && l.source === 'referral').length;
    await waitFor(() => expect(within(column('Converted')).queryAllByRole('article')).toHaveLength(Math.min(expected, 10)));
  });
});

describe('Leads list: bulk actions + export + view toggle', () => {
  const rowChecks = () => screen.getAllByRole('checkbox', { name: /Select row/ });

  test('rows select -> bulk bar -> status badlo -> DB update + selection clear', async () => {
    renderWithProviders(<LeadsPage />);
    await screen.findByText(`1–20 of ${db.leads.length}`);
    const [a, b] = rowChecks();
    const ids = [a, b].map((c) => c.getAttribute('aria-label').replace('Select row ', ''));
    fireEvent.click(a);
    fireEvent.click(b);
    expect(await screen.findByText('2 selected')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Bulk status'), { target: { value: 'lost' } });
    await waitFor(() => expect(ids.every((id) => db.leads.find((l) => l.id === id).status === 'lost')).toBe(true));
    await waitFor(() => expect(screen.queryByText(/selected/)).toBeNull());
  });

  test('select all + Clear', async () => {
    renderWithProviders(<LeadsPage />);
    await screen.findByText(`1–20 of ${db.leads.length}`);
    fireEvent.click(screen.getByLabelText('Select all rows'));
    expect(await screen.findByText('20 selected')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText('20 selected')).toBeNull();
  });

  test('bulk delete: confirm dialog ke baad hi delete', async () => {
    renderWithProviders(<LeadsPage />);
    await screen.findByText(`1–20 of ${db.leads.length}`);
    const id = rowChecks()[0].getAttribute('aria-label').replace('Select row ', '');
    fireEvent.click(rowChecks()[0]);
    fireEvent.click(await screen.findByRole('button', { name: /Delete/ }));
    expect(db.leads.some((l) => l.id === id)).toBe(true); // abhi sirf dialog khula
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(db.leads.some((l) => l.id === id)).toBe(false));
  });

  test('bulk actions sirf permission walo ko: sirf lead.read ho to checkbox par bhi assign/delete nahi', async () => {
    renderWithProviders(<LeadsPage />, { permissions: ['lead.read'] });
    await screen.findByText(`1–20 of ${db.leads.length}`);
    fireEvent.click(rowChecks()[0]);
    await screen.findByText('1 selected');
    expect(screen.queryByLabelText('Bulk assign')).toBeNull();
    expect(screen.queryByLabelText('Bulk status')).toBeNull();
    expect(screen.queryByRole('button', { name: /Delete/ })).toBeNull();
  });

  test('Export: URL ke filters ke saath CSV download', async () => {
    globalThis.__nav.params = new URLSearchParams('status=converted&page=2');
    renderWithProviders(<LeadsPage />);
    await screen.findByText(/of \d+/);
    fireEvent.click(screen.getByRole('button', { name: /Export/ }));
    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1));
    const [blob, filename] = saveBlob.mock.calls[0];
    expect(filename).toMatch(/\.csv$/);
    const lines = (await blobText(blob)).split('\n');
    expect(lines.length - 1).toBe(db.leads.filter((l) => l.status === 'converted').length); // page ignore, filter lagu
  });

  test('view=board URL par pipeline dikhta hai; toggle se list wapas', async () => {
    globalThis.__nav.params = new URLSearchParams('view=board');
    renderWithProviders(<LeadsPage />);
    expect(await screen.findByLabelText('Lead pipeline')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(globalThis.__nav.replace).toHaveBeenCalledWith('/crm/leads');
  });
});

describe('Command palette', () => {
  test('page search + Enter se navigate', async () => {
    const onClose = vi.fn();
    renderWithProviders(<CommandPalette open onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Search commands'), { target: { value: 'stud' } });
    expect(await screen.findByRole('option', { name: /Students/ })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' });
    expect(globalThis.__nav.push).toHaveBeenCalledWith('/crm/students');
    expect(onClose).toHaveBeenCalled();
  });

  test('lead naam se live search', async () => {
    renderWithProviders(<CommandPalette open onClose={() => {}} />);
    const lead = db.leads[0];
    fireEvent.change(screen.getByLabelText('Search commands'), { target: { value: lead.phone } });
    const option = await screen.findByRole('option', { name: new RegExp(lead.name) }, { timeout: 2000 });
    fireEvent.click(option);
    expect(globalThis.__nav.push).toHaveBeenCalledWith(`/crm/leads/${lead.id}`);
  });

  test('arrow keys + Escape', async () => {
    const onClose = vi.fn();
    renderWithProviders(<CommandPalette open onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    const first = screen.getAllByRole('option')[0];
    expect(first.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  test('permission ke bina actions/pages nahi dikhte', () => {
    renderWithProviders(<CommandPalette open onClose={() => {}} />, { permissions: ['student.read'] });
    expect(screen.queryByRole('option', { name: /New lead/ })).toBeNull();
    expect(screen.queryByRole('option', { name: /Payments/ })).toBeNull();
    expect(screen.getByRole('option', { name: /Students/ })).toBeTruthy();
  });
});

describe('Breadcrumbs + theme', () => {
  test('buildCrumbs', () => {
    expect(buildCrumbs('/crm/leads/l12/edit').map((c) => c.label)).toEqual(['CRM', 'Leads', 'Details', 'Edit']);
    expect(buildCrumbs('/crm/leads/l12/edit')[0].linkable).toBe(false); // /crm khud page nahi
    expect(buildCrumbs('/crm/leads')[1]).toMatchObject({ label: 'Leads', linkable: false }); // current page
    expect(buildCrumbs('/admin/users/new')[1]).toMatchObject({ label: 'Users', linkable: true });
  });

  test('theme toggle: system -> light -> dark (html class)', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const btn = () => screen.getByRole('button', { name: /^Theme:/ });
    await waitFor(() => expect(btn().getAttribute('aria-label')).toMatch(/Theme: System/));
    fireEvent.click(btn());
    await waitFor(() => expect(btn().getAttribute('aria-label')).toMatch(/Theme: Light/));
    fireEvent.click(btn());
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
  });
});

describe('Dashboard', () => {
  test('admin: KPIs + range badalne par data badalta hai + widgets', async () => {
    renderWithProviders(<DashboardPage />);
    const kpi = async (label) => (await screen.findByText(label)).closest('div.rounded-xl');
    const total30 = db.leads.filter((l) => Date.now() - new Date(l.createdAt).getTime() <= 30 * 86400000).length;
    await waitFor(async () => expect(within(await kpi('Total leads')).getByText(String(total30))).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: '90 days' }));
    await waitFor(async () => expect(within(await kpi('Total leads')).getByText(String(db.leads.length))).toBeTruthy());

    expect(await screen.findByText('Aaj ke followups')).toBeTruthy();
    expect(await screen.findByText('Recent activity')).toBeTruthy();
    expect(await screen.findByText('Top counsellors')).toBeTruthy();
  });

  test('report.read nahi to KPI/charts nahi, par followups widget dikhta hai', async () => {
    renderWithProviders(<DashboardPage />, { permissions: ['followup.read'] });
    expect(await screen.findByText('Aaj ke followups')).toBeTruthy();
    expect(screen.queryByText('Total leads')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Date range' })).toBeNull();
  });
});
