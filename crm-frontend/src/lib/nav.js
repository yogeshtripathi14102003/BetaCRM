import {
  LayoutDashboard,
  Users,
  PhoneCall,
  Activity,
  FileText,
  GraduationCap,
  CreditCard,
  FolderCheck,
  MessageSquare,
  BarChart3,
  Upload,
  Users2,
  Shield,
  UserCog,
  ScrollText,
   BadgeCheck ,

} from 'lucide-react';

// Sidebar yahin se banta hai. `perm` na ho to sabko dikhega; `module` ho to us module ke users ko.
// Naya page: yahan ek item add karo + src/app/(app)/<path>/page.js banao.
export const NAV = [
  { items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  {
    title: 'CRM',
    module: 'crm',
    items: [
      { label: 'Leads', href: '/crm/leads', icon: Users, perm: 'lead.read' },
      { label: 'Followups', href: '/crm/followups', icon: PhoneCall, perm: 'followup.read' },
      { label: 'Activities', href: '/crm/activities', icon: Activity, perm: 'activity.read' },
      { label: 'Applications', href: '/crm/applications', icon: FileText, perm: 'application.read' },
{ label: 'Admissions', href: '/crm/admissions', icon: BadgeCheck, perm: 'admission.read' },      { label: 'Students', href: '/crm/students', icon: GraduationCap, perm: 'student.read' },
      { label: 'Payments', href: '/crm/payments', icon: CreditCard, perm: 'payment.read' },
      { label: 'Documents', href: '/crm/documents', icon: FolderCheck, perm: 'document.read' },
      { label: 'Templates', href: '/crm/communication', icon: MessageSquare, perm: 'communication.send' },
      { label: 'Reports', href: '/crm/reports', icon: BarChart3, perm: 'report.read' },
      { label: 'Import / Export', href: '/crm/imports', icon: Upload, perm: 'lead.import' },

    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users2, perm: 'user.read' },
      { label: 'Roles', href: '/admin/roles', icon: Shield, perm: 'role.read' },
      { label: 'Teams', href: '/admin/teams', icon: UserCog, perm: 'team.read' },
      { label: 'Audit logs', href: '/admin/audit', icon: ScrollText, perm: 'audit.read' },
    ],
  },
];
