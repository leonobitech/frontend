// lib/injectCleanCookiesScript.ts

export function getCleanCookiesScript(): string {
  return `
    (function() {
      var keep = ['accessKey', 'clientKey', 'sidebar:state'];
      document.cookie.split(';').forEach(function(c) {
        var name = c.split('=')[0].trim();
        if (
          keep.includes(name) ||
          name.startsWith('__cf') ||
          name.startsWith('cf_')
        ) return;

        document.cookie = name + '=; Max-Age=0; path=/; domain=.leonobitech.com;';
        console.warn('🍪 Cookie eliminada:', name);
      });
    })();
  `;
}
