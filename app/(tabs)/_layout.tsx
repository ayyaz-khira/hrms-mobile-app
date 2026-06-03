import { Tabs, router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, TouchableOpacity, StyleSheet, Text, Dimensions, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useLeaveStore } from '../../store/leaveStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const roles = useLeaveStore((state) => state.roles);
  const isApprover = roles.includes('Leave Approver');
  const isHod = roles.includes('HOD') || roles.includes('Department Head');

  const C = {
    primary: '#4361EE',
    bg: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#343A40',
    subText: isDarkMode ? '#94A3B8' : '#ADB5BD',
    border: isDarkMode ? '#334155' : '#F1F3F5',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    itemBg: isDarkMode ? '#334155' : '#F8F9FA',
  };

  const menuItems = [
    { label: 'Leave History', icon: 'list.bullet.indent', color: '#5C6BC0', path: '/leave-history' },
    { label: 'Apply Leave', icon: 'bed.fill', color: '#42A5F5', path: '/apply-leave' },
    { label: 'Gate Pass', icon: 'door.right.hand.open', color: '#4FC3F7', path: '/gate-pass' },
    { label: 'Asset Request', icon: 'building.2.fill', color: '#90A4AE', path: '/asset' },
    { label: 'Company Updates', icon: 'bell.fill', color: '#FF9800', path: '/updates' },
  ];

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuVisible(!menuVisible);
  };

  return (
    <View style={styles.tabBarContainer}>
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { bottom: 100 + insets.bottom, backgroundColor: C.card }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.menuItem,
                  { backgroundColor: C.card },
                  index !== menuItems.length - 1 && { borderBottomColor: C.border, borderBottomWidth: 1 }
                ]}
                onPress={() => {
                   setMenuVisible(false);
                   if (item.path) {
                     router.push(item.path as any);
                   }
                }}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: C.itemBg }]}>
                  <IconSymbol name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.menuItemLabel, { color: C.text }]}>{item.label}</Text>
                <IconSymbol name="chevron.right" size={16} color={C.subText} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Background Shape with Cutout */}
      <View style={[styles.tabBarBackground, { height: 60 + insets.bottom, backgroundColor: C.bg, borderTopColor: C.border }]}>
        <View style={styles.tabBarCutoutContainer}>
          <View style={[styles.tabBarCutout, { backgroundColor: C.bg }]} />
        </View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, menuVisible && styles.fabActive, { backgroundColor: C.bg }]} 
        activeOpacity={0.8}
        onPress={toggleMenu}
      >
        <View style={[styles.fabInner, menuVisible && styles.fabInnerActive]}>
          <IconSymbol name={menuVisible ? "xmark" : "plus"} size={24} color="#FFFFFF" />
        </View>
        {!menuVisible && <Text style={[styles.fabLabel, { color: C.subText }]}>Apply</Text>}
      </TouchableOpacity>

      <View style={[styles.tabsRow, { bottom: Platform.OS === 'ios' ? insets.bottom : 5 }]}>
        {(() => {
          const visibleRoutes = state.routes.filter((route: any) => {
            if (route.name === 'pending-approvals' || route.name === 'hod-approvals') return false;
            // Always hide the Approvals tab from the bottom navigation bar
            if (route.name === 'approvals') return false;
            return true;
          });

          const fabSpaceIndex = Math.floor(visibleRoutes.length / 2);

          return visibleRoutes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.title !== undefined ? options.title : route.name;
            const isFocused = state.routes[state.index]?.name === route.name;

            const getIcon = () => {
              switch (route.name) {
                case 'home': return 'square.grid.2x2.fill';
                case 'attend': return 'calendar';
                case 'leave': return 'bed.fill';
                case 'approvals': return 'checkmark.seal.fill';
                case 'profile': return 'person.fill';
                default: return 'house.fill';
              }
            };

            return (
              <React.Fragment key={route.key}>
                {index === fabSpaceIndex && <View style={styles.fabSpace} />}
                
                <TouchableOpacity
                  onPress={() => navigation.navigate(route.name)}
                  style={styles.tabItem}
                  activeOpacity={0.7}
                >
                  <IconSymbol 
                    size={22} 
                    name={getIcon() as any} 
                    color={isFocused ? C.primary : C.subText} 
                  />
                  <Text 
                    style={[
                      styles.tabLabel, 
                      { 
                        color: isFocused ? C.primary : C.subText,
                        fontWeight: isFocused ? '800' : '600'
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          });
        })()}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const segments = useSegments();

  // Load roles once on component mount
  const fetchRoles = useLeaveStore((state) => state.fetchRoles);
  useEffect(() => {
    const load = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        await fetchRoles(userId);
      }
    };
    load();
  }, []);

  const roles = useLeaveStore((state) => state.roles);
  const isApprover = roles.includes('Leave Approver');
  const isHod = roles.includes('HOD') || roles.includes('Department Head');

  const tabRoutes = ['home', 'attend', 'leave', 'approvals', 'profile'];

  const currentTab = segments[1] || 'home';
  const currentIndex = tabRoutes.indexOf(currentTab);

  const navigateTo = (routeName: string) => {
    router.push(`/(tabs)/${routeName}` as any);
  };

  const swipeLeft = Gesture.Fling()
    .direction(2)
    .onStart(() => {
      if (currentIndex >= 0 && currentIndex < tabRoutes.length - 1) {
        runOnJS(navigateTo)(tabRoutes[currentIndex + 1]);
      }
    });

  const swipeRight = Gesture.Fling()
    .direction(1)
    .onStart(() => {
      if (currentIndex > 0) {
        runOnJS(navigateTo)(tabRoutes[currentIndex - 1]);
      }
    });

  const composed = Gesture.Race(swipeLeft, swipeRight);

  return (
    <GestureDetector gesture={composed}>
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}>
          <Tabs.Screen name="home" options={{ title: 'Home' }} />
          <Tabs.Screen name="attend" options={{ title: 'Attend' }} />
          <Tabs.Screen name="leave" options={{ title: 'Leave' }} />
          <Tabs.Screen name="approvals" options={{ title: 'Approvals' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'transparent' },
  tabBarBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  tabBarCutoutContainer: { width: 80, alignItems: 'center', overflow: 'hidden' },
  tabBarCutout: { width: 90, height: 90, borderRadius: 45, marginTop: -75 },
  tabsRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', height: 60, alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontSize: 8.5, fontWeight: '700', letterSpacing: -0.2 },
  fabSpace: { width: 60 },
  fab: { position: 'absolute', top: -55, left: width / 2 - 28, width: 56, height: 56, borderRadius: 28, padding: 5, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, zIndex: 10, alignItems: 'center' },
  fabInner: { width: '100%', height: '100%', borderRadius: 24, backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center' },
  fabActive: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  fabInnerActive: { backgroundColor: '#FF5A5F', borderWidth: 0 },
  fabLabel: { fontSize: 10, fontWeight: '700', marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  menuContainer: { width: width * 0.8, borderRadius: 24, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  menuIconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  menuItemLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
