import { APP_VERSION } from '../config/version';

export const translations = {
  en: {
    dir: 'ltr',
    nav: {
      tagline: 'Fast Local File Transfer',
      howItWorks: 'How it Works',
      features: 'Features',
      download: 'Download',
      faq: 'FAQ',
      downloadBtn: 'Download for Windows',
    },
    hero: {
      badge: `Free & Open Source • Version ${APP_VERSION}`,
      title: 'The Fastest, Easiest Way to Transfer Files',
      titleHighlight: 'Between PC & Phone',
      description: 'Transfer photos, 4K videos, and large folders directly over your local Wi-Fi at maximum router speed — zero internet, zero cloud, and no app installation required on your phone.',
      downloadWindows: 'Download for Windows',
      version: `Version ${APP_VERSION}`,
      mobileNotice: '📱 Phones (iPhone & Android): Zero apps required — simply scan the QR code with your camera',
    },
    preview: {
      pcTitle: 'Your Windows PC',
      pcStatus: 'Ready on Local Wi-Fi',
      qrHint: 'Scan QR with phone camera to connect instantly',
      dropZone: 'Drag and drop files or folders here',
      transferBridge: 'Direct 100% Local Transfer',
      transferSpeed: 'Full Router Speed • 0 Internet Used',
      phoneTitle: 'Your Phone (iPhone / Android)',
      phoneStatus: 'Connected in Browser',
      phoneHint: 'Runs directly in mobile browser, no app store install',
      receiveReady: 'Ready to send and receive instantly',
    },
    howItWorks: {
      title: 'How It Works',
      titleHighlight: 'In 3 Intuitive Steps',
      subtitle: 'No accounts, no Bluetooth pairing headaches, no waiting for slow cloud uploads.',
      steps: [
        {
          num: '1',
          title: 'Open on Your PC',
          description: 'Launch FILE FLY directly on Windows. It is a lightweight portable app requiring zero setup or installation.',
        },
        {
          num: '2',
          title: 'Scan the QR Code with Your Phone',
          description: 'Point your iPhone or Android camera at the screen QR code to launch the transfer web interface immediately.',
        },
        {
          num: '3',
          title: 'Transfer at Maximum Speed',
          description: 'Drag and drop any files or entire folders. Everything transfers instantly at the maximum speed of your local Wi-Fi.',
        },
      ],
    },
    features: {
      title: 'Why FILE FLY?',
      titleHighlight: 'Engineered for Speed & Complete Privacy',
      subtitle: 'A true cross-platform AirDrop alternative connecting Windows PCs with all mobile devices seamlessly.',
      items: [
        {
          title: 'True Wi-Fi Speeds (Up to 100MB/s)',
          description: 'Dozens of times faster than Bluetooth or slow cloud uploads. Transfer gigabytes of videos and folders in seconds.',
        },
        {
          title: '100% Offline (Zero Internet)',
          description: 'Transfers stay completely inside your local Wi-Fi network. Works even if your internet is down or over a hotspot.',
        },
        {
          title: 'Total Privacy (Zero Cloud)',
          description: 'Files are never uploaded to any third-party servers. Your data stays strictly between your own devices in your home.',
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Direct answers to key questions.',
      items: [
        {
          q: 'Does file transfer consume any internet or mobile data?',
          a: 'Not at all! Transfers happen 100% locally across your Wi-Fi network (LAN). Zero bytes of your internet data allowance are touched.',
        },
        {
          q: 'Can I transfer files outside of my local network?',
          a: 'No, all devices must be connected to the exact same Wi-Fi router or local network (LAN). This direct local connection is what enables maximum transfer speed and complete privacy without internet. You can also connect via a phone mobile hotspot completely offline without consuming cellular data!',
        },
        {
          q: 'Do I need to install an app on my iPhone or Android?',
          a: 'No, that is the beauty of FILE FLY. You simply open your phone camera and scan the QR code displayed on your PC screen, opening the web transfer interface instantly.',
        },
        {
          q: 'Is there any file size limit?',
          a: 'There are no limits. You can send large 4K movies, entire multi-gigabyte folders, or hundreds of photos in one batch; FILE FLY automatically handles folders by compressing them as ZIP.',
        },
        {
          q: 'What operating systems are supported?',
          a: 'The desktop app runs on Windows 10 & 11. Recipient devices can be anything on the same Wi-Fi: iPhones, iPads, Android phones, Macs, and Linux PCs.',
        },
      ],
    },
    footer: {
      developedBy: 'Developed by',
      rights: 'All rights reserved',
      quickLinks: 'Quick Links',
      githubRepo: 'GitHub Repository',
      releases: 'Release Notes',
      license: 'MIT Open Source License',
      downloadBtn: 'Download for Windows (.exe)',
    },
  },
};
