import { create } from 'zustand';
import { LeaveRequest, LeaveBalance } from '../types/leave';
import { leaveApi } from '../services/leaveApi';

interface LeaveStoreState {
  roles: string[];
  leaveBalances: LeaveBalance[];
  pendingApprovals: LeaveRequest[];
  hodApprovals: LeaveRequest[];
  myRequests: LeaveRequest[];
  loading: boolean;
  error: string | null;

  setRoles: (roles: string[]) => void;
  fetchRoles: (userId: string) => Promise<void>;
  fetchLeaveBalances: (userId: string) => Promise<void>;
  fetchMyRequests: (userId: string) => Promise<void>;
  fetchPendingApprovals: (userId: string) => Promise<void>;
  fetchHodApprovals: (userId: string) => Promise<void>;
  approveLeaveRequest: (leaveId: string, roleType: 'Approver' | 'HOD') => Promise<boolean>;
  rejectLeaveRequest: (leaveId: string, roleType: 'Approver' | 'HOD') => Promise<boolean>;
  forwardRequestToHod: (leaveId: string) => Promise<boolean>;
  clearStore: () => void;
}

export const useLeaveStore = create<LeaveStoreState>((set, get) => ({
  roles: [],
  leaveBalances: [],
  pendingApprovals: [],
  hodApprovals: [],
  myRequests: [],
  loading: false,
  error: null,

  setRoles: (roles) => set({ roles }),

  fetchRoles: async (userId) => {
    set({ loading: true, error: null });
    try {
      const details = await leaveApi.getUserDetails();
      // The API wraps the role list inside `data` (e.g., {status:'success', data:{roles:[...]}})
      const roles =
        details?.roles ||
        details?.data?.roles ||
        details?.message?.roles ||
        details?.message?.data?.roles ||
        ['Employee'];
      set({ roles, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch user roles', loading: false });
      set({ roles: ['Employee'] }); // Safe fallback on error
    }
  },

  fetchLeaveBalances: async (userId) => {
    set({ loading: true, error: null });
    try {
      const leaveBalances = await leaveApi.getLeaveBalance(userId);
      set({ leaveBalances, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch leave balances', loading: false });
    }
  },

  fetchMyRequests: async (userId) => {
    set({ loading: true, error: null });
    try {
      const myRequests = await leaveApi.getMyLeaves(userId);
      set({ myRequests, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch my leaves', loading: false });
    }
  },

  fetchPendingApprovals: async (userId) => {
    set({ loading: true, error: null });
    try {
      const pendingApprovals = await leaveApi.getPendingLeaveRequests(userId, 'Approver');
      set({ pendingApprovals, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch pending approvals', loading: false });
    }
  },

  fetchHodApprovals: async (userId) => {
    set({ loading: true, error: null });
    try {
      const hodApprovals = await leaveApi.getPendingLeaveRequests(userId, 'HOD');
      set({ hodApprovals, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch HOD approvals', loading: false });
    }
  },

  approveLeaveRequest: async (leaveId, roleType) => {
    set({ loading: true, error: null });
    try {
      const success = await leaveApi.approveLeave(leaveId);
      if (success) {
        if (roleType === 'Approver') {
          set((state) => ({
            pendingApprovals: state.pendingApprovals.filter((r) => r.name !== leaveId),
          }));
        } else {
          set((state) => ({
            hodApprovals: state.hodApprovals.filter((r) => r.name !== leaveId),
          }));
        }
      }
      set({ loading: false });
      return success;
    } catch (err: any) {
      set({ error: err.message || 'Failed to approve request', loading: false });
      return false;
    }
  },

  rejectLeaveRequest: async (leaveId, roleType) => {
    set({ loading: true, error: null });
    try {
      const success = await leaveApi.rejectLeave(leaveId);
      if (success) {
        if (roleType === 'Approver') {
          set((state) => ({
            pendingApprovals: state.pendingApprovals.filter((r) => r.name !== leaveId),
          }));
        } else {
          set((state) => ({
            hodApprovals: state.hodApprovals.filter((r) => r.name !== leaveId),
          }));
        }
      }
      set({ loading: false });
      return success;
    } catch (err: any) {
      set({ error: err.message || 'Failed to reject request', loading: false });
      return false;
    }
  },

  forwardRequestToHod: async (leaveId) => {
    set({ loading: true, error: null });
    try {
      const success = await leaveApi.forwardToHod(leaveId);
      if (success) {
        set((state) => ({
          pendingApprovals: state.pendingApprovals.filter((r) => r.name !== leaveId),
        }));
      }
      set({ loading: false });
      return success;
    } catch (err: any) {
      set({ error: err.message || 'Failed to forward request', loading: false });
      return false;
    }
  },

  clearStore: () => {
    set({
      roles: [],
      leaveBalances: [],
      pendingApprovals: [],
      hodApprovals: [],
      myRequests: [],
      loading: false,
      error: null,
    });
  },
}));
