// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'creditcard.fill': 'credit-card',
  'sun.max.fill': 'wb-sunny',
  'cart.fill': 'shopping-cart',
  'bed.double.fill': 'hotel',
  'calendar.badge.clock': 'event-available',
  'person.badge.shield.check': 'verified-user',
  'banknote.fill': 'payments',
  'arrow.left.arrow.right': 'swap-horiz',
  'tray.and.arrow.down.fill': 'move-to-inbox',
  'checkmark.square.fill': 'check-box',
  'receipt.fill': 'receipt',
  'calendar.badge.plus': 'event',
  'bag.fill': 'shopping-bag',
  'airplane.departure': 'flight-takeoff',
  'clock.fill': 'access-time',
  'location.fill': 'location-on',
  'wallet.pass.fill': 'account-balance-wallet',
  'list.bullet.indent': 'format-list-bulleted',
  'creditcard.and.123': 'payment',
  'door.right.hand.open': 'login',
  'plus': 'add',
  'magnifyingglass': 'search',
  'qrcode.viewfinder': 'qr-code-scanner',
  'person.fill': 'person',
  'bell.fill': 'notifications-none',
  'arrow.right.to.line': 'logout',
  'xmark': 'close',
  'hourglass': 'hourglass-bottom',
  'calendar': 'calendar-today',
  'arrow.down.right': 'south-east',
  'arrow.up.right': 'north-east',
  'alarm': 'alarm',
  'alarm.fill': 'alarm-on',
  'money.bag': 'local-mall',
  'bed.fill': 'hotel',
  'clipboard.fill': 'assignment',
  'idcard.fill': 'badge',
  'task.fill': 'task',
  'payment.fill': 'payments',
  'wallet.fill': 'account-balance-wallet',
  'star.fill': 'stars',
  'graduationcap.fill': 'school',
  'lock.fill': 'lock',
  'character.book.closed.fill': 'language',
  'paintbrush.fill': 'palette',
  'doc.text.fill': 'description',
  'building.2.fill': 'business',
  'building.fill': 'business',
  'envelope.fill': 'email',
  'phone.fill': 'phone',
  'faceid': 'fingerprint',
  'camera.fill': 'camera-alt',
  'photo.fill': 'photo',
  'square.grid.2x2.fill': 'grid-view',
  'chevron.left': 'chevron-left',
  'heart.fill': 'favorite',
  'person.2.fill': 'people',
  'zzz': 'nights-stay',
  'arrow.left': 'arrow-back',
  'doc.fill': 'article',
  'checkmark': 'check',
  'chevron.down': 'expand-more',
  'eye.slash.fill': 'visibility-off',
  'calendar.fill': 'event',
  'clock.arrow.circlepath': 'history',
  'pencil': 'edit',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'arrow.down.left.circle.fill': 'arrow-circle-down',
  'arrow.up.right.circle.fill': 'arrow-circle-up',
  'timer': 'timer',
  'checkmark.seal.fill': 'verified',
  'star.circle.fill': 'stars',
  'chart.bar.doc.horizontal.fill': 'poll',
  'hand.thumbsup': 'thumb-up',
  'bubble.left': 'chat-bubble',
  'square.and.pencil': 'edit',
  'lock.shield.fill': 'admin-panel-settings',
  'questionmark.circle.fill': 'help',
  'line.3.horizontal': 'menu',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
