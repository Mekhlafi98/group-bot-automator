import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            // Navigation
            'nav.dashboard': 'Dashboard',
            'nav.contacts': 'Contacts',
            'nav.settings': 'Settings',
            'nav.analytics': 'Analytics',
            'nav.logout': 'Logout',

            // Dashboard
            'dashboard.title': 'WhatsApp Chat Management',
            'dashboard.welcome': 'Welcome to your WhatsApp management dashboard',
            'dashboard.selectContact': 'Select a contact to start chatting',

            // Contacts
            'contacts.search': 'Search contacts...',
            'contacts.syncContacts': 'Sync Contacts',
            'contacts.noContacts': 'No contacts found',
            'contacts.online': 'Online',
            'contacts.offline': 'Offline',
            'contacts.lastSeen': 'Last seen',

            // Chat
            'chat.typeMessage': 'Type a message...',
            'chat.send': 'Send',
            'chat.typing': 'typing...',
            'chat.delivered': 'Delivered',
            'chat.read': 'Read',
            'chat.sent': 'Sent',

            // Settings
            'settings.title': 'Settings',
            'settings.language': 'Language',
            'settings.theme': 'Theme',
            'settings.notifications': 'Notifications',
            'settings.whatsappConnection': 'WhatsApp Connection',
            'settings.profile': 'Profile',

            // Common
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.today': 'Today',
            'common.yesterday': 'Yesterday',

            // Language options
            'language.english': 'English',
            'language.arabic': 'العربية',
        }
    },
    ar: {
        translation: {
            // Navigation
            'nav.dashboard': 'لوحة التحكم',
            'nav.contacts': 'جهات الاتصال',
            'nav.settings': 'الإعدادات',
            'nav.analytics': 'التحليلات',
            'nav.logout': 'تسجيل الخروج',

            // Dashboard
            'dashboard.title': 'إدارة محادثات واتساب',
            'dashboard.welcome': 'مرحباً بك في لوحة تحكم إدارة واتساب',
            'dashboard.selectContact': 'اختر جهة اتصال لبدء المحادثة',

            // Contacts
            'contacts.search': 'البحث في جهات الاتصال...',
            'contacts.syncContacts': 'مزامنة جهات الاتصال',
            'contacts.noContacts': 'لم يتم العثور على جهات اتصال',
            'contacts.online': 'متصل',
            'contacts.offline': 'غير متصل',
            'contacts.lastSeen': 'آخر ظهور',

            // Chat
            'chat.typeMessage': 'اكتب رسالة...',
            'chat.send': 'إرسال',
            'chat.typing': 'يكتب...',
            'chat.delivered': 'تم التسليم',
            'chat.read': 'تم القراءة',
            'chat.sent': 'تم الإرسال',

            // Settings
            'settings.title': 'الإعدادات',
            'settings.language': 'اللغة',
            'settings.theme': 'المظهر',
            'settings.notifications': 'الإشعارات',
            'settings.whatsappConnection': 'اتصال واتساب',
            'settings.profile': 'الملف الشخصي',

            // Common
            'common.save': 'حفظ',
            'common.cancel': 'إلغاء',
            'common.loading': 'جاري التحميل...',
            'common.error': 'خطأ',
            'common.success': 'نجح',
            'common.today': 'اليوم',
            'common.yesterday': 'أمس',

            // Language options
            'language.english': 'English',
            'language.arabic': 'العربية',
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;