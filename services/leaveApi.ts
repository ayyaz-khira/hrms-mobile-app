import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeaveRequest, LeaveBalance, LeaveType } from '../types/leave';

const BASE_URL = 'https://staging.microcrispr.com/api/method/hrms_application.api';

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('user_token');
  if (!token) throw new Error('No authentication token found');

  const rawToken = token.trim();
  const authHeader = rawToken.replace(/^(bearer|token)\s+/i, '');

  return {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

export const leaveApi = {
  getUserDetails: async (): Promise<any> => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BASE_URL}.get_user_details`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) throw new Error(`Failed to fetch user details: ${response.status}`);
      const result = await response.json();
      return result.message || result;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  },

  // Login API to obtain and store auth token
  login: async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('https://yourdomain.com/api/method/custom_app.api.mobile_login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ usr: email.trim(), pwd: password.trim() }),
      });
      if (!response.ok) throw new Error(`Login failed: ${response.status}`);
      const result = await response.json();
      const token = result.message?.token;
      if (!token) throw new Error('Token not found in login response');
      await AsyncStorage.setItem('user_token', token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  getLeaveBalance: async (userId: string): Promise<LeaveBalance[]> => {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}.get_leave_balance`, {
      credentials: 'include',
      method: 'POST',
      headers,
      body: JSON.stringify({ employee: userId.trim() }),
    });
    if (!response.ok) throw new Error(`Failed to fetch leave balance: ${response.status}`);
    const result = await response.json();
    return result.message || [];
  },

  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}.get_leave_types`, {
      credentials: 'include',
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error(`Failed to fetch leave types: ${response.status}`);
    const result = await response.json();
    return result.message || [];
  },

  getMyLeaves: async (userId: string): Promise<LeaveRequest[]> => {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}.get_my_leaves`, {
      credentials: 'include',
      method: 'POST',
      headers,
      body: JSON.stringify({ employee: userId.trim() }),
    });
    if (!response.ok) throw new Error(`Failed to fetch my leaves: ${response.status}`);
    const result = await response.json();
    // Support nested structure or raw array
    return result.message?.data || result.message || [];
  },

  getPendingLeaveRequests: async (userId: string, roleType: 'Approver' | 'HOD'): Promise<LeaveRequest[]> => {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}.get_pending_leave_requests`, {
      credentials: 'include',
      method: 'POST',
      headers,
      body: JSON.stringify({ employee: userId.trim(), role_type: roleType }),
    });
    if (!response.ok) throw new Error(`Failed to fetch pending leaves: ${response.status}`);
    const result = await response.json();
    return result.message || [];
  },

  approveLeave: async (leaveId: string): Promise<boolean> => {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}.approve_leave`, {
      credentials: 'include',
      method: 'POST',
      headers,
      body: JSON.stringify({ leave_id: leaveId }),
    });
    if (!response.ok) throw new Error(`Failed to approve leave: ${response.status}`);
    const result = await response.json();
    return !!result.message;
  },

  rejectLeave: async (leaveId: string): Promise<boolean> => {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}.reject_leave`, {
      credentials: 'include',
      method: 'POST',
      headers,
      body: JSON.stringify({ leave_id: leaveId }),
    });
    if (!response.ok) throw new Error(`Failed to reject leave: ${response.status}`);
    const result = await response.json();
    return !!result.message;
  },

  forwardToHod: async (leaveId: string): Promise<boolean> => {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}.forward_to_hod`, {
      credentials: 'include',
      method: 'POST',
      headers,
      body: JSON.stringify({ leave_id: leaveId }),
    });
    if (!response.ok) throw new Error(`Failed to forward leave to HOD: ${response.status}`);
    const result = await response.json();
    return !!result.message;
  },
};
