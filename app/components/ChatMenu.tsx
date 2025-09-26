import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const getStyles = (theme: any) => StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContent: {
    position: 'absolute',
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
    flex: 1,
  },
  dangerText: {
    color: theme.error || '#DC2626',
  },
  warningText: {
    color: theme.warning || '#F59E0B',
  },
});

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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  if (!selectedChat) return null;

  // Calculate menu position to ensure it's visible on screen
  const menuHeight = 400; // Approximate height
  const menuWidth = 180;
  const screenHeight = 800; // Approximate screen height
  const screenWidth = 400; // Approximate screen width

  let adjustedPosition = { ...position };

  // Adjust vertical position if menu would go off screen
  if (position.y + menuHeight > screenHeight) {
    adjustedPosition.y = Math.max(0, screenHeight - menuHeight - 20);
  }

  // Adjust horizontal position if menu would go off screen
  if (position.x + menuWidth > screenWidth) {
    adjustedPosition.x = Math.max(0, screenWidth - menuWidth - 20);
  }

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
        <View style={[styles.menuContent, { backgroundColor: theme.surface }, { top: adjustedPosition.y, left: adjustedPosition.x }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('viewProfile')}
          >
            <Ionicons name="person" size={20} color={theme.textSecondary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              {activeTab === 'chats' ? 'View Profile' : 'Group Info'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('splitBill')}
          >
            <Ionicons name="receipt" size={20} color={theme.textSecondary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Split Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('mute')}
          >
            <Ionicons name="volume-mute" size={20} color={theme.textSecondary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              {mutedChats.has(selectedChat._id) ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>

          {activeTab === 'chats' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => onMenuOption('block')}
            >
              <Ionicons name="ban" size={20} color={theme.error} />
              <Text style={[styles.menuItemText, styles.dangerText]}>
                {blockedUsers.has(selectedChat._id) ? 'Unblock' : 'Block'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('archive')}
          >
            <Ionicons name="archive" size={20} color={theme.textSecondary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              {archivedChats.has(selectedChat._id) ? 'Unarchive' : 'Archive'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('clear')}
          >
            <Ionicons name="trash" size={20} color={theme.warning} />
            <Text style={[styles.menuItemText, styles.warningText]}>Clear Chat</Text>
          </TouchableOpacity>

          {activeTab === 'chats' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => onMenuOption('report')}
            >
              <Ionicons name="flag" size={20} color={theme.error} />
              <Text style={[styles.menuItemText, styles.dangerText]}>Report</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onMenuOption('delete')}
          >
            <Ionicons name="trash" size={20} color={theme.error} />
            <Text style={[styles.menuItemText, styles.dangerText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ChatMenu;