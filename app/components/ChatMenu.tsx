import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatMenuProps {
  visible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  activeTab: 'chats' | 'groups';
  selectedChat: any;
  mutedChats: Set<string>;
  blockedUsers: Set<string>;
  archivedChats: Set<string>;
  onMenuOption: (option: string) => void;
}

export const ChatMenu: React.FC<ChatMenuProps> = ({
  visible,
  onClose,
  position,
  activeTab,
  selectedChat,
  mutedChats,
  blockedUsers,
  archivedChats,
  onMenuOption,
}) => {
  if (!selectedChat) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menuContent, { top: position.y, left: position.x }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('viewProfile')}
          >
            <Ionicons name="person" size={20} color="#374151" />
            <Text style={styles.menuItemText}>
              {activeTab === 'chats' ? 'View Profile' : 'Group Info'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('splitBill')}
          >
            <Ionicons name="receipt" size={20} color="#374151" />
            <Text style={styles.menuItemText}>Split Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('mute')}
          >
            <Ionicons name="volume-mute" size={20} color="#374151" />
            <Text style={styles.menuItemText}>
              {mutedChats.has(selectedChat._id) ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>

          {activeTab === 'chats' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => onMenuOption('block')}
            >
              <Ionicons name="ban" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.dangerText]}>
                {blockedUsers.has(selectedChat._id) ? 'Unblock' : 'Block'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('archive')}
          >
            <Ionicons name="archive" size={20} color="#374151" />
            <Text style={styles.menuItemText}>
              {archivedChats.has(selectedChat._id) ? 'Unarchive' : 'Archive'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('clear')}
          >
            <Ionicons name="trash" size={20} color="#F59E0B" />
            <Text style={[styles.menuItemText, styles.warningText]}>Clear Chat</Text>
          </TouchableOpacity>

          {activeTab === 'chats' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => onMenuOption('report')}
            >
              <Ionicons name="flag" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.dangerText]}>Report</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('delete')}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={[styles.menuItemText, styles.dangerText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ChatMenu;

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContent: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dangerText: {
    color: '#EF4444',
  },
  warningText: {
    color: '#F59E0B',
  },
});