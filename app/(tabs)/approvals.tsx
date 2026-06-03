import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '../../context/ThemeContext';
import { useLeaveStore } from '../../store/leaveStore';
import { LeaveRequest } from '../../types/leave';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function ApprovalsScreen() {
  const { isDarkMode } = useTheme();
  const {
    roles,
    pendingApprovals,
    hodApprovals,
    loading,
    fetchPendingApprovals,
    fetchHodApprovals,
    approveLeaveRequest,
    rejectLeaveRequest,
    forwardRequestToHod,
    fetchRoles,
  } = useLeaveStore();

  const isApprover = roles.includes('Leave Approver');
  const isHod = roles.includes('HOD') || roles.includes('Department Head');

  // Active tab state: 'approver' or 'hod'
  const [activeSegment, setActiveSegment] = useState<'approver' | 'hod'>(
    isApprover ? 'approver' : 'hod'
  );

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load user roles when the screen gains focus
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const userId = await AsyncStorage.getItem('user_id');
        if (userId) {
          await fetchRoles(userId);
        }
      };
      init();
    }, []),
  );

  // After roles are loaded, fetch the relevant approval lists and set the active tab
  useEffect(() => {
    const loadApprovals = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) return;
      if (isApprover) await fetchPendingApprovals(userId);
      if (isHod) await fetchHodApprovals(userId);
    };
    loadApprovals();
  }, [roles]);

  // Keep the active segment in sync with role changes
  useEffect(() => {
    if (isApprover) {
      setActiveSegment('approver');
    } else {
      setActiveSegment('hod');
    }
  }, [isApprover]);

  const C = {
    primary: '#4361EE',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    bg: isDarkMode ? '#0B0E14' : '#F8F9FB',
    card: isDarkMode ? '#161B22' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#212529',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#050505' : '#1B1B2F',
    gray50: isDarkMode ? '#1F2937' : '#F8F9FA',
    gray100: isDarkMode ? '#374151' : '#F1F3F5',
  };

  const handleApprove = async (request: LeaveRequest, roleType: 'Approver' | 'HOD') => {
    Alert.alert(
      'Approve Leave',
      `Are you sure you want to approve this request for ${request.employee_name || request.employee}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingId(request.name);
            const success = await approveLeaveRequest(request.name, roleType);
            setProcessingId(null);
            if (success) {
              setModalVisible(false);
              Alert.alert('Success', 'Leave request approved successfully.');
            } else {
              Alert.alert('Error', 'Failed to approve leave request.');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (request: LeaveRequest, roleType: 'Approver' | 'HOD') => {
    Alert.alert(
      'Reject Leave',
      `Are you sure you want to reject this request for ${request.employee_name || request.employee}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(request.name);
            const success = await rejectLeaveRequest(request.name, roleType);
            setProcessingId(null);
            if (success) {
              setModalVisible(false);
              Alert.alert('Success', 'Leave request rejected.');
            } else {
              Alert.alert('Error', 'Failed to reject leave request.');
            }
          },
        },
      ]
    );
  };

  const handleForward = async (request: LeaveRequest) => {
    Alert.alert(
      'Forward Request',
      `Forward this leave request to HOD for final approval?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forward',
          onPress: async () => {
            setProcessingId(request.name);
            const success = await forwardRequestToHod(request.name);
            setProcessingId(null);
            if (success) {
              setModalVisible(false);
              Alert.alert('Success', 'Leave request forwarded to HOD.');
            } else {
              Alert.alert('Error', 'Failed to forward leave request.');
            }
          },
        },
      ]
    );
  };

  const showDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const currentList = activeSegment === 'approver' ? pendingApprovals : hodApprovals;
  const currentRole = activeSegment === 'approver' ? 'Approver' : 'HOD';

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <View style={{ width: 40 }} />
              <Text style={styles.headerTitle}>Approvals</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>
      </View>

      {/* Segment Selector for Multiple Roles */}
      {isApprover && isHod && (
        <View style={[styles.segmentWrapper, { backgroundColor: C.card }]}>
          <View style={[styles.segmentContainer, { backgroundColor: C.gray50 }]}>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                activeSegment === 'approver' && { backgroundColor: C.primary },
              ]}
              onPress={() => setActiveSegment('approver')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: activeSegment === 'approver' ? '#FFFFFF' : C.subText },
                ]}
              >
                Approver
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                activeSegment === 'hod' && { backgroundColor: C.primary },
              ]}
              onPress={() => setActiveSegment('hod')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: activeSegment === 'hod' ? '#FFFFFF' : C.subText },
                ]}
              >
                HOD Queue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
      >
        {loading && currentList.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : currentList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: C.card }]}>
            <IconSymbol name="checkmark.seal.fill" size={48} color={C.gray100} />
            <Text style={[styles.emptyText, { color: C.text }]}>No Pending Actions</Text>
            <Text style={[styles.emptySub, { color: C.subText }]}>
              All applications in this queue have been processed.
            </Text>
          </View>
        ) : (
          <View style={styles.requestList}>
            {currentList.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[styles.requestCard, { backgroundColor: C.card }]}
                onPress={() => showDetails(item)}
              >
                <View style={styles.requestTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empName, { color: C.text }]}>
                      {item.employee_name || item.employee}
                    </Text>
                    <Text style={[styles.leaveType, { color: C.primary }]}>
                      {item.leave_type}
                    </Text>
                    <Text style={[styles.dateRange, { color: C.subText }]}>
                      {item.from_date} to {item.to_date}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: C.primary + '15' }]}>
                    <Text style={[styles.badgeText, { color: C.primary }]}>
                      {item.total_leave_days} Days
                    </Text>
                  </View>
                </View>

                {item.reason ? (
                  <Text style={[styles.reasonText, { color: C.subText }]} numberOfLines={2}>
                    Reason: {item.reason}
                  </Text>
                ) : null}

                <View style={[styles.divider, { backgroundColor: C.gray100 }]} />

                {/* Quick Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item, currentRole)}
                    disabled={processingId === item.name}
                  >
                    <IconSymbol name="xmark.circle.fill" size={14} color={C.danger} />
                    <Text style={[styles.actionBtnText, { color: C.danger }]}>Reject</Text>
                  </TouchableOpacity>

                  {activeSegment === 'approver' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.forwardBtn]}
                      onPress={() => handleForward(item)}
                      disabled={processingId === item.name}
                    >
                      <IconSymbol name="arrow.right.circle.fill" size={14} color={C.warning} />
                      <Text style={[styles.actionBtnText, { color: C.warning }]}>Forward</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(item, currentRole)}
                    disabled={processingId === item.name}
                  >
                    <IconSymbol name="checkmark.circle.fill" size={14} color={C.success} />
                    <Text style={[styles.actionBtnText, { color: C.success }]}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Details Modal */}
      {selectedRequest && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <View style={[styles.modalCard, { backgroundColor: C.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: C.text }]}>
                  {currentRole} Review
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <IconSymbol name="xmark" size={24} color={C.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: height * 0.5 }}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: C.subText }]}>EMPLOYEE</Text>
                  <Text style={[styles.detailValue, { color: C.text }]}>
                    {selectedRequest.employee_name || selectedRequest.employee} ({selectedRequest.employee})
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: C.subText }]}>LEAVE TYPE</Text>
                  <Text style={[styles.detailValue, { color: C.primary, fontWeight: '800' }]}>
                    {selectedRequest.leave_type}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: C.subText }]}>DURATION</Text>
                  <Text style={[styles.detailValue, { color: C.text }]}>
                    {selectedRequest.from_date} to {selectedRequest.to_date} ({selectedRequest.total_leave_days} days)
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: C.subText }]}>REASON</Text>
                  <Text style={[styles.detailValue, { color: C.text }]}>
                    {selectedRequest.reason || 'No reason provided'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: C.subText }]}>STATUS</Text>
                  <View style={[styles.badge, { backgroundColor: C.warning + '20', alignSelf: 'flex-start', marginTop: 4 }]}>
                    <Text style={[styles.badgeText, { color: C.warning }]}>{selectedRequest.status}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.divider, { backgroundColor: C.gray100, marginVertical: 15 }]} />

              {/* Modal Actions */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { borderColor: C.danger, borderWidth: 1 }]}
                  onPress={() => handleReject(selectedRequest, currentRole)}
                  disabled={processingId !== null}
                >
                  <Text style={[styles.modalActionText, { color: C.danger }]}>Reject</Text>
                </TouchableOpacity>

                {activeSegment === 'approver' && (
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { borderColor: C.warning, borderWidth: 1 }]}
                    onPress={() => handleForward(selectedRequest)}
                    disabled={processingId !== null}
                  >
                    <Text style={[styles.modalActionText, { color: C.warning }]}>Forward</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: C.success }]}
                  onPress={() => handleApprove(selectedRequest, currentRole)}
                  disabled={processingId !== null}
                >
                  {processingId === selectedRequest.name ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalActionText, { color: '#FFFFFF' }]}>Approve</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  headerContainer: { backgroundColor: 'transparent', zIndex: 10 },
  headerBg: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  segmentWrapper: { paddingHorizontal: 20, paddingVertical: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  segmentContainer: { flexDirection: 'row', padding: 4, borderRadius: 14 },
  segmentItem: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segmentText: { fontSize: 13, fontWeight: '800' },
  content: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
  emptyCard: { margin: 20, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)' },
  emptyText: { marginTop: 15, fontSize: 16, fontWeight: '800' },
  emptySub: { marginTop: 6, fontSize: 12, textAlign: 'center' },
  requestList: { paddingHorizontal: 20, gap: 15 },
  requestCard: { borderRadius: 24, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  empName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  leaveType: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  dateRange: { fontSize: 11, fontWeight: '600' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  reasonText: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  divider: { height: 1, marginVertical: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionBtn: { flex: 1, height: 36, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  rejectBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  forwardBtn: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  approveBtn: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 28, padding: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  detailRow: { marginBottom: 15 },
  detailLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalActionBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalActionText: { fontSize: 14, fontWeight: '800' },
});
