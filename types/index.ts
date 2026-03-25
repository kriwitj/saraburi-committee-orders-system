export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';
export type OrderStatus = 'ACTIVE' | 'CANCELLED' | 'DRAFT' | 'DELETED';

export interface Agency {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  prefix: string | null;
  name: string | null;
  agencyId: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Member {
  id: string;
  subCommitteeId: string;
  name: string | null;
  agencyPosition: string | null;
  agency: string | null;
  role: string | null;
  seq: number;
}

export interface SubCommittee {
  id: string;
  orderId: string;
  name: string;
  seq: number;
  duties: string | null;
  members: Member[];
}

export interface Attachment {
  id: string;
  orderId: string;
  filename: string;
  originalName: string;
  fileType: string;
  blobUrl: string;
  size: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string | null;
  effectiveDate: string | null;
  type: string;
  title: string;
  background: string | null;
  signedBy: string | null;
  signedByTitle: string | null;
  status: OrderStatus;
  cancelReason: string | null;
  agencyId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  subCommittees: SubCommittee[];
  attachments: Attachment[];
}

export interface Settings {
  orderTypes: string[];
  memberRoles: string[];
}

export const DEFAULT_ORDER_TYPES = ['คณะกรรมการ', 'คณะทำงาน', 'คณะอนุกรรมการ'];

export const DEFAULT_MEMBER_ROLES = [
  'ประธานกรรมการ',
  'รองประธานกรรมการ',
  'กรรมการ',
  'กรรมการและเลขานุการ',
  'กรรมการและผู้ช่วยเลขานุการ',
  'ประธานคณะทำงาน',
  'รองประธานคณะทำงาน',
  'หัวหน้าคณะทำงาน',
  'คณะทำงาน',
  'คณะทำงานและเลขานุการ',
  'คณะทำงานและผู้ช่วยเลขานุการ',
  'เลขานุการ',
  'ผู้ช่วยเลขานุการ',
  'เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)',
  'อื่น ๆ',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  ACTIVE: 'มีผลบังคับ',
  CANCELLED: 'ยกเลิกแล้ว',
  DRAFT: 'ร่าง',
  DELETED: 'ถูกลบ',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  ACTIVE: '#065f46',
  CANCELLED: '#991b1b',
  DRAFT: '#92400e',
  DELETED: '#6b7280',
};

export const TYPE_COLORS: Record<string, string> = {
  'คณะกรรมการ': '#1e40af',
  'คณะทำงาน': '#065f46',
  'คณะอนุกรรมการ': '#92400e',
};

export function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || '#4b5563';
}

export const ROLE_BADGE_COLORS: Record<string, string> = {
  'ประธานกรรมการ': '#7c2d12',
  'รองประธานกรรมการ': '#9a3412',
  'ประธานคณะทำงาน': '#164e63',
  'รองประธานคณะทำงาน': '#155e75',
  'หัวหน้าคณะทำงาน': '#164e63',
  'กรรมการและเลขานุการ': '#4a1d96',
  'กรรมการและผู้ช่วยเลขานุการ': '#5b21b6',
  'คณะทำงานและเลขานุการ': '#4a1d96',
  'คณะทำงานและผู้ช่วยเลขานุการ': '#5b21b6',
  'เลขานุการ': '#4a1d96',
  'ผู้ช่วยเลขานุการ': '#5b21b6',
  'เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)': '#701a75',
};

export function getRoleColor(role: string): string {
  return ROLE_BADGE_COLORS[role] || '#374151';
}
