import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  Dimensions, 
  TextInput, 
  Modal, 
  Pressable, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface AvatarProps {
  name: string;
  color: string;
  image?: string;
}

const AvatarLogo = ({ name, color, image }: AvatarProps) => (
  <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
    {image ? (
      <Image source={{ uri: image }} style={styles.avatarImage} />
    ) : (
      <Text style={[styles.avatarText, { color: color }]}>{name.split(' ').map(n => n[0]).join('')}</Text>
    )}
  </View>
);

export default function UpdatesScreen() {
  const { isDarkMode } = useTheme();
  
  // Logic from useUpdates
  const [activeTab, setActiveTab] = useState('Posts');
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [createPollVisible, setCreatePollVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = (type: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCreatePostVisible(false);
      setCreatePollVisible(false);
    }, 1500);
  };

  const C = {
    primary: '#4361EE',
    bg: isDarkMode ? '#0F172A' : '#F8F9FB',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#000000' : '#1B1B2F',
    gray50: isDarkMode ? '#334155' : '#F8F9FA',
    gray100: isDarkMode ? '#334155' : '#F1F3F5',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    success: '#4CAF50',
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />
      
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: C.dark }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <IconSymbol name="arrow.left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Updates</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        {['Posts', 'Events'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && { borderBottomColor: C.primary }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? C.primary : C.subText }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={[styles.createBar, { backgroundColor: C.card, borderBottomColor: C.border }]}>
          <TouchableOpacity style={styles.createBtn} onPress={() => setCreatePostVisible(true)}>
             <View style={[styles.iconBox, { backgroundColor: C.primary + '15' }]}>
                <IconSymbol name="square.and.pencil" size={18} color={C.primary} />
             </View>
             <Text style={[styles.createBtnText, { color: C.text }]}>Create Post</Text>
          </TouchableOpacity>
          <View style={[styles.vertDivider, { backgroundColor: C.border }]} />
          <TouchableOpacity style={styles.createBtn} onPress={() => setCreatePollVisible(true)}>
             <View style={[styles.iconBox, { backgroundColor: C.success + '15' }]}>
                <IconSymbol name="chart.bar.doc.horizontal.fill" size={18} color={C.success} />
             </View>
             <Text style={[styles.createBtnText, { color: C.text }]}>Create Poll</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.feed}>
          <View style={[styles.postCard, { backgroundColor: C.card }]}>
            <View style={styles.postHeader}>
              <AvatarLogo name="Nilesh Mak" color={C.primary} />
              <View>
                <View style={styles.nameRow}>
                   <Text style={[styles.authorName, { color: C.text }]}>Nilesh Mak</Text>
                   <IconSymbol name="building.2.fill" size={16} color={C.primary} />
                </View>
                <Text style={[styles.postTime, { color: C.subText }]}>7 months ago</Text>
              </View>
            </View>

            <View style={[styles.postContent, { backgroundColor: isDarkMode ? '#0F172A' : '#1B1B2F' }]}>
              <Text style={styles.contentTitle}>🚀 From 9 Seconds to 2.1 Seconds — Here's How We Did It</Text>
              <Text style={styles.contentText}>
                A client's Flutter app had a frustrating 9-second load time...
              </Text>
            </View>

            <View style={styles.interactionBar}>
               <View style={styles.leftInteractions}>
                  <TouchableOpacity style={[styles.interactBtn, { backgroundColor: C.gray50 }]}>
                    <IconSymbol name="hand.thumbsup" size={18} color={C.subText} />
                  </TouchableOpacity>
                  <Text style={[styles.interactText, { color: C.subText }]}>1 like</Text>
               </View>
               <TouchableOpacity style={[styles.interactBtn, { backgroundColor: C.gray50, paddingHorizontal: 15 }]}>
                  <IconSymbol name="bubble.left" size={18} color={C.subText} />
                  <Text style={[styles.interactText, { color: C.subText, marginLeft: 8 }]}>7 Comments</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={createPostVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setCreatePostVisible(false)}>
          <View style={[styles.createModal, { backgroundColor: C.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>New Post</Text>
              <TouchableOpacity onPress={() => setCreatePostVisible(false)}>
                <IconSymbol name="xmark" size={20} color={C.text} />
              </TouchableOpacity>
            </View>
            <TextInput 
              style={[styles.modalInput, { color: C.text, backgroundColor: C.gray50 }]}
              placeholder="What's on your mind?"
              placeholderTextColor={C.subText}
              multiline
              autoFocus
            />
            <TouchableOpacity style={styles.publishBtn} onPress={() => handleCreate('post')}>
               {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishText}>Publish Post</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={createPollVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setCreatePollVisible(false)}>
          <View style={[styles.createModal, { backgroundColor: C.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                 <IconSymbol name="chart.bar.doc.horizontal.fill" size={20} color={C.success} />
                 <Text style={[styles.modalTitle, { color: C.text }]}>Create Poll</Text>
              </View>
              <TouchableOpacity onPress={() => setCreatePollVisible(false)}>
                <IconSymbol name="xmark" size={20} color={C.text} />
              </TouchableOpacity>
            </View>
            <TextInput 
              style={[styles.modalInputSmall, { color: C.text, backgroundColor: C.gray50 }]}
              placeholder="Ask a question..."
              placeholderTextColor={C.subText}
            />
            <View style={styles.optionInputs}>
               <TextInput style={[styles.optIn, { color: C.text, backgroundColor: C.gray50 }]} placeholder="Option 1" placeholderTextColor={C.subText} />
               <TextInput style={[styles.optIn, { color: C.text, backgroundColor: C.gray50 }]} placeholder="Option 2" placeholderTextColor={C.subText} />
            </View>
            <TouchableOpacity style={[styles.publishBtn, { backgroundColor: C.success }]} onPress={() => handleCreate('poll')}>
               {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishText}>Start Poll</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  headerContainer: { backgroundColor: 'transparent', zIndex: 10 },
  headerBg: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '700' },
  content: { flex: 1 },
  createBar: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, elevation: 2 },
  createBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { fontSize: 13, fontWeight: '700' },
  vertDivider: { width: 1, height: 30, alignSelf: 'center' },
  feed: { paddingVertical: 20 },
  postCard: { marginHorizontal: 0, marginBottom: 20, padding: 18, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 1 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 15, fontWeight: '800' },
  postTime: { fontSize: 12, marginTop: 2 },
  postContent: { borderRadius: 20, padding: 22, marginBottom: 15, elevation: 5 },
  contentTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 12, lineHeight: 22 },
  contentText: { color: '#CBD5E1', fontSize: 13, lineHeight: 20 },
  interactionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  leftInteractions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  interactBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  interactText: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  createModal: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalInput: { height: 150, borderRadius: 16, padding: 15, fontSize: 15, textAlignVertical: 'top', marginBottom: 20 },
  modalInputSmall: { height: 50, borderRadius: 12, paddingHorizontal: 15, fontSize: 15, marginBottom: 15 },
  optionInputs: { gap: 10, marginBottom: 20 },
  optIn: { height: 45, borderRadius: 10, paddingHorizontal: 15, fontSize: 14 },
  publishBtn: { height: 56, borderRadius: 18, backgroundColor: '#4361EE', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  publishText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
