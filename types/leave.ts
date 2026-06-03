export interface LeaveRequest {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Forwarded';
}

export interface LeaveBalance {
  leave_type: string;
  max_leaves: number;
  leaves_taken: number;
  balance: number;
}

export interface LeaveType {
  name: string;
  leave_type_name: string;
}

export interface UserRolesResponse {
  roles: string[];
}
